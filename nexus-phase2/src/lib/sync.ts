// Bidirectional Sync Logic for Nexus Phase 2
// Handles sync between Markdown files and D1 database

import type { D1Database, Project, ProjectStatus, ProjectPriority } from '../types';
import { getAllProjects, createProject, updateProject, deleteProject } from './db';
import { generateProjectId } from './utils';

// ============================================
// Types for Sync
// ============================================

export interface ParsedProject {
  id?: string; // May not exist for new projects from markdown
  title: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  // Extracted from markdown content
  rawContent: string;
  markdownSection: string;
  metadata?: {
    targetCompletion?: string;
    started?: string;
    completed?: string;
    keyDeliverables?: string[];
    featuresRequired?: string[];
    dependencies?: string[];
    [key: string]: unknown;
  };
}

export interface SyncResult {
  success: boolean;
  direction: 'to_d1' | 'to_file' | 'bidirectional';
  summary: {
    created: number;
    updated: number;
    deleted: number;
    conflicts: number;
    unchanged: number;
  };
  details: {
    created: string[];
    updated: string[];
    deleted: string[];
    conflicts: Array<{
      projectId: string;
      title: string;
      resolution: 'kept_d1' | 'kept_file' | 'merged';
      reason: string;
    }>;
  };
  errors: string[];
  timestamp: string;
}

export interface SyncOptions {
  direction?: 'to_d1' | 'to_file' | 'bidirectional';
  dryRun?: boolean;
  conflictResolution?: 'prefer_d1' | 'prefer_file' | 'manual';
}

// ============================================
// Markdown Parsing
// ============================================

/**
 * Parse PROJECTS.md content into structured project data
 */
export function parseProjectsMarkdown(content: string): ParsedProject[] {
  const projects: ParsedProject[] = [];
  
  // Split by major sections (## headers)
  const sections = content.split(/\n## /);
  
  for (const section of sections) {
    const project = parseProjectSection(section);
    if (project) {
      projects.push(project);
    }
  }
  
  return projects;
}

/**
 * Parse a single project section from markdown
 */
function parseProjectSection(section: string): ParsedProject | null {
  // Skip non-project sections (header, backlog, etc.)
  const sectionTitle = section.split('\n')[0].trim();
  if (!sectionTitle || 
      sectionTitle.startsWith('Projects') || 
      sectionTitle === 'Backlog' ||
      sectionTitle === 'Completed Projects' ||
      sectionTitle.startsWith('---')) {
    return null;
  }
  
  // Extract project title (### heading)
  const titleMatch = section.match(/###\s+(.+?)(?:\n|$)/);
  if (!titleMatch) return null;
  
  const title = titleMatch[1].trim();
  
  // Extract status
  const statusMatch = section.match(/\*\*Status:\*\*\s*(.+?)(?:\n|$)/);
  const status = parseStatus(statusMatch?.[1] || '');
  
  // Extract priority
  const priorityMatch = section.match(/\*\*Priority:\*\*\s*(.+?)(?:\n|$)/);
  const priority = parsePriority(priorityMatch?.[1] || '');
  
  // Extract description (content between **Description:** and next ** or ##)
  const descMatch = section.match(/\*\*Description:\*\*\s*\n?([\s\S]*?)(?=\n\*\*|$)/);
  const description = descMatch?.[1]?.trim();
  
  // Extract metadata
  const metadata: ParsedProject['metadata'] = {};
  
  // Target completion
  const targetMatch = section.match(/\*\*Target Completion:\*\*\s*(.+?)(?:\n|$)/i);
  if (targetMatch) metadata.targetCompletion = targetMatch[1].trim();
  
  // Started date
  const startedMatch = section.match(/\*\*Started:\*\*\s*(.+?)(?:\n|$)/i);
  if (startedMatch) metadata.started = startedMatch[1].trim();
  
  // Completed date
  const completedMatch = section.match(/\*\*Completed:\*\*\s*(.+?)(?:\n|$)/i);
  if (completedMatch) metadata.completed = completedMatch[1].trim();
  
  // Key deliverables
  const deliverablesMatch = section.match(/\*\*Key Deliverables:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/);
  if (deliverablesMatch) {
    metadata.keyDeliverables = deliverablesMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^\s*-\s*/, '').trim());
  }
  
  // Features required
  const featuresMatch = section.match(/\*\*Features Required:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/);
  if (featuresMatch) {
    metadata.featuresRequired = featuresMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^\s*-\s*/, '').trim());
  }
  
  return {
    title,
    description,
    status,
    priority,
    rawContent: section,
    markdownSection: sectionTitle,
    metadata,
  };
}

/**
 * Parse status from markdown text
 */
function parseStatus(statusText: string): ProjectStatus {
  const normalized = statusText.toLowerCase().trim();
  
  if (normalized.includes('progress') || normalized.includes('🔄')) {
    return 'in_progress';
  }
  if (normalized.includes('done') || normalized.includes('complete') || normalized.includes('✅')) {
    return 'done';
  }
  if (normalized.includes('archive')) {
    return 'archived';
  }
  if (normalized.includes('backlog') || normalized.includes('📅')) {
    return 'backlog';
  }
  
  // Default based on common patterns
  if (normalized.includes('planning') || normalized.includes('ready')) {
    return 'backlog';
  }
  
  return 'backlog';
}

/**
 * Parse priority from markdown text
 */
function parsePriority(priorityText: string): ProjectPriority {
  const normalized = priorityText.toLowerCase().trim();
  
  if (normalized.includes('high')) {
    return 'high';
  }
  if (normalized.includes('low')) {
    return 'low';
  }
  return 'medium';
}

// ============================================
// Markdown Generation
// ============================================

/**
 * Generate PROJECTS.md content from D1 project data
 */
export function generateProjectsMarkdown(projects: Project[]): string {
  const lines: string[] = [
    '# Projects',
    '',
    '> Source of Truth for all active and planned projects',
    `> Last Updated: ${new Date().toISOString().split('T')[0]}`,
    '',
    '---',
    '',
  ];
  
  // Group projects by status
  const grouped = groupProjectsByStatus(projects);
  
  // Active Projects
  lines.push('## Active Projects');
  lines.push('');
  
  const activeProjects = [
    ...grouped.in_progress,
    ...grouped.backlog,
  ].sort((a, b) => {
    // Sort by priority first, then by sort_order
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.sort_order - b.sort_order;
  });
  
  for (const project of activeProjects) {
    lines.push(...formatProjectForMarkdown(project));
    lines.push('');
  }
  
  // Completed Projects
  if (grouped.done.length > 0 || grouped.archived.length > 0) {
    lines.push('## Completed Projects');
    lines.push('');
    
    const completedProjects = [...grouped.done, ...grouped.archived].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    
    for (const project of completedProjects) {
      lines.push(...formatProjectForMarkdown(project, true));
      lines.push('');
    }
  }
  
  // Backlog section with simple list
  const backlogProjects = grouped.backlog.filter(p => 
    !activeProjects.find(ap => ap.id === p.id)
  );
  
  if (backlogProjects.length > 0) {
    lines.push('## Backlog');
    lines.push('');
    for (const project of backlogProjects) {
      lines.push(`- ${project.title} (${project.priority} priority)`);
    }
    lines.push('');
  }
  
  // Footer
  lines.push('---');
  lines.push('');
  lines.push('**Sync:** This file ↔ D1 ↔ Nexus Projects Section');
  lines.push('**Update Method:** Universal "Update" button triggers full sync of all Operations Manual content');
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Group projects by status
 */
function groupProjectsByStatus(projects: Project[]): Record<ProjectStatus, Project[]> {
  return {
    backlog: projects.filter(p => p.status === 'backlog'),
    in_progress: projects.filter(p => p.status === 'in_progress'),
    done: projects.filter(p => p.status === 'done'),
    archived: projects.filter(p => p.status === 'archived'),
  };
}

/**
 * Format a single project for markdown output
 */
function formatProjectForMarkdown(project: Project, compact = false): string[] {
  const lines: string[] = [];
  
  lines.push(`### ${project.title}`);
  lines.push(`**Status:** ${formatStatus(project.status)}`);
  lines.push(`**Priority:** ${project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}`);
  
  if (!compact) {
    if (project.metadata?.started) {
      lines.push(`**Started:** ${project.metadata.started}`);
    }
    if (project.metadata?.targetCompletion) {
      lines.push(`**Target Completion:** ${project.metadata.targetCompletion}`);
    }
  }
  
  lines.push('');
  
  if (project.description) {
    lines.push('**Description:**');
    lines.push(project.description);
    lines.push('');
  }
  
  // Include metadata fields if present
  if (!compact && project.metadata) {
    const meta = project.metadata;
    
    if (meta.keyDeliverables && Array.isArray(meta.keyDeliverables) && meta.keyDeliverables.length > 0) {
      lines.push('**Key Deliverables:**');
      for (const item of meta.keyDeliverables) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }
    
    if (meta.featuresRequired && Array.isArray(meta.featuresRequired) && meta.featuresRequired.length > 0) {
      lines.push('**Features Required:**');
      for (const item of meta.featuresRequired) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }
  }
  
  return lines;
}

/**
 * Format status with emoji for markdown
 */
function formatStatus(status: ProjectStatus): string {
  const statusMap: Record<ProjectStatus, string> = {
    backlog: '📅 Backlog',
    in_progress: '🔄 In Progress',
    done: '✅ Complete',
    archived: '📦 Archived',
  };
  return statusMap[status] || status;
}

// ============================================
// Conflict Detection & Resolution
// ============================================

export interface Conflict {
  projectId: string;
  title: string;
  d1Version: Project;
  fileVersion: ParsedProject;
  d1Updated: Date;
  fileContent: string;
  fieldDiffs: Array<{
    field: string;
    d1Value: unknown;
    fileValue: unknown;
  }>;
}

/**
 * Detect conflicts between D1 and file versions of projects
 */
export function detectConflicts(
  d1Projects: Project[],
  fileProjects: ParsedProject[]
): Conflict[] {
  const conflicts: Conflict[] = [];
  
  for (const fileProject of fileProjects) {
    // Try to find matching D1 project by title
    const d1Project = d1Projects.find(p => 
      p.title.toLowerCase().trim() === fileProject.title.toLowerCase().trim()
    );
    
    if (!d1Project) continue; // New project, no conflict
    
    // Check if there are meaningful differences
    const fieldDiffs: Conflict['fieldDiffs'] = [];
    
    if (d1Project.description !== fileProject.description) {
      fieldDiffs.push({
        field: 'description',
        d1Value: d1Project.description,
        fileValue: fileProject.description,
      });
    }
    
    if (d1Project.status !== fileProject.status) {
      fieldDiffs.push({
        field: 'status',
        d1Value: d1Project.status,
        fileValue: fileProject.status,
      });
    }
    
    if (d1Project.priority !== fileProject.priority) {
      fieldDiffs.push({
        field: 'priority',
        d1Value: d1Project.priority,
        fileValue: fileProject.priority,
      });
    }
    
    // Only flag as conflict if there are field differences
    if (fieldDiffs.length > 0) {
      conflicts.push({
        projectId: d1Project.id,
        title: d1Project.title,
        d1Version: d1Project,
        fileVersion: fileProject,
        d1Updated: new Date(d1Project.updated_at),
        fileContent: fileProject.rawContent,
        fieldDiffs,
      });
    }
  }
  
  return conflicts;
}

/**
 * Resolve conflicts using specified strategy
 */
export function resolveConflicts(
  conflicts: Conflict[],
  strategy: 'prefer_d1' | 'prefer_file' | 'manual'
): Array<{ conflict: Conflict; resolution: 'kept_d1' | 'kept_file' | 'merged'; reason: string }> {
  return conflicts.map(conflict => {
    switch (strategy) {
      case 'prefer_d1':
        return {
          conflict,
          resolution: 'kept_d1' as const,
          reason: 'D1 version preferred per conflict resolution strategy',
        };
      case 'prefer_file':
        return {
          conflict,
          resolution: 'kept_file' as const,
          reason: 'File version preferred per conflict resolution strategy',
        };
      case 'manual':
      default:
        // Default to D1 if manual and no guidance
        return {
          conflict,
          resolution: 'kept_d1' as const,
          reason: 'Manual resolution required - defaulting to D1 version',
        };
    }
  });
}

// ============================================
// Sync Operations
// ============================================

/**
 * Perform bidirectional sync between markdown file and D1
 */
export async function performBidirectionalSync(
  db: D1Database,
  markdownContent: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    direction: 'bidirectional',
    summary: {
      created: 0,
      updated: 0,
      deleted: 0,
      conflicts: 0,
      unchanged: 0,
    },
    details: {
      created: [],
      updated: [],
      deleted: [],
      conflicts: [],
    },
    errors: [],
    timestamp: new Date().toISOString(),
  };
  
  try {
    // Parse markdown content
    const parsedProjects = parseProjectsMarkdown(markdownContent);
    
    // Get current D1 projects
    const d1Projects = await getAllProjects(db);
    
    // Detect conflicts
    const conflicts = detectConflicts(d1Projects, parsedProjects);
    result.summary.conflicts = conflicts.length;
    
    // Resolve conflicts
    const resolvedConflicts = resolveConflicts(
      conflicts,
      options.conflictResolution || 'prefer_d1'
    );
    
    for (const resolved of resolvedConflicts) {
      result.details.conflicts.push({
        projectId: resolved.conflict.projectId,
        title: resolved.conflict.title,
        resolution: resolved.resolution,
        reason: resolved.reason,
      });
    }
    
    if (options.dryRun) {
      // Just report what would happen
      return result;
    }
    
    // Determine sync direction based on options
    const direction = options.direction || 'bidirectional';
    result.direction = direction;
    
    if (direction === 'to_d1' || direction === 'bidirectional') {
      // Sync from file to D1
      await syncToD1(db, parsedProjects, d1Projects, resolvedConflicts, result);
    }
    
    if (direction === 'to_file' || direction === 'bidirectional') {
      // Generate new markdown (caller will save it)
      result.summary.unchanged = d1Projects.length - result.summary.created - result.summary.updated;
    }
    
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error during sync');
  }
  
  return result;
}

/**
 * Sync parsed markdown projects to D1
 */
async function syncToD1(
  db: D1Database,
  fileProjects: ParsedProject[],
  d1Projects: Project[],
  resolvedConflicts: Array<{ conflict: Conflict; resolution: string }>,
  result: SyncResult
): Promise<void> {
  // Track which D1 projects have been matched
  const matchedD1Ids = new Set<string>();
  
  for (const fileProject of fileProjects) {
    try {
      // Find matching D1 project
      const existingProject = d1Projects.find(p => 
        p.title.toLowerCase().trim() === fileProject.title.toLowerCase().trim()
      );
      
      if (existingProject) {
        matchedD1Ids.add(existingProject.id);
        
        // Check if this was a conflict
        const conflictResolution = resolvedConflicts.find(
          r => r.conflict.projectId === existingProject.id
        );
        
        if (conflictResolution && conflictResolution.resolution === 'kept_d1') {
          // Skip update, keep D1 version
          continue;
        }
        
        // Check if update is needed
        const needsUpdate = 
          existingProject.description !== fileProject.description ||
          existingProject.status !== fileProject.status ||
          existingProject.priority !== fileProject.priority;
        
        if (needsUpdate) {
          await updateProject(db, existingProject.id, {
            description: fileProject.description,
            status: fileProject.status,
            priority: fileProject.priority,
            metadata: fileProject.metadata,
          });
          
          result.summary.updated++;
          result.details.updated.push(existingProject.id);
        }
      } else {
        // Create new project
        const newProject = await createProject(db, {
          id: generateProjectId(),
          title: fileProject.title,
          description: fileProject.description,
          status: fileProject.status,
          priority: fileProject.priority,
          sort_order: 0,
          metadata: fileProject.metadata,
        });
        
        result.summary.created++;
        result.details.created.push(newProject.id);
      }
    } catch (error) {
      result.errors.push(`Failed to sync project "${fileProject.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Handle deleted projects (in D1 but not in file)
  // Only in bidirectional mode with prefer_d1 strategy do we keep them
  // Otherwise, we consider them deleted from the file
  for (const d1Project of d1Projects) {
    if (!matchedD1Ids.has(d1Project.id)) {
      const fileExists = fileProjects.some(p => 
        p.title.toLowerCase().trim() === d1Project.title.toLowerCase().trim()
      );
      
      if (!fileExists) {
        // Project exists in D1 but not in file
        // Don't delete, just mark as archived
        if (d1Project.status !== 'archived') {
          await updateProject(db, d1Project.id, { status: 'archived' });
          result.summary.updated++;
          result.details.updated.push(`${d1Project.id} (archived - removed from file)`);
        }
      }
    }
  }
}

/**
 * Sync from D1 to markdown file
 */
export async function syncToFile(
  db: D1Database
): Promise<{ content: string; projectCount: number }> {
  const projects = await getAllProjects(db);
  const content = generateProjectsMarkdown(projects);
  
  return {
    content,
    projectCount: projects.length,
  };
}

// ============================================
// Operations Manual Sync (other markdown files)
// ============================================

export interface OperationsManualSection {
  name: string;
  filename: string;
  lastSync: string | null;
  content: string;
}

/**
 * Parse operations manual markdown into sections
 */
export function parseOperationsManual(content: string): OperationsManualSection[] {
  const sections: OperationsManualSection[] = [];
  
  // Split by ## headers
  const parts = content.split(/\n## /);
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part.trim()) continue;
    
    const lines = part.split('\n');
    const title = lines[0].trim();
    
    if (title && !title.startsWith('#')) {
      sections.push({
        name: title,
        filename: '', // Set by caller
        lastSync: null,
        content: '## ' + part,
      });
    }
  }
  
  return sections;
}

/**
 * Generate table of contents for operations manual
 */
export function generateTableOfContents(sections: OperationsManualSection[]): string {
  const lines: string[] = ['## Table of Contents', ''];
  
  for (const section of sections) {
    const anchor = section.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    lines.push(`- [${section.name}](#${anchor})`);
  }
  
  lines.push('');
  return lines.join('\n');
}

/**
 * Search/filter operations manual content
 */
export function searchOperationsManual(
  sections: OperationsManualSection[],
  query: string
): OperationsManualSection[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) return sections;
  
  return sections.filter(section => 
    section.name.toLowerCase().includes(normalizedQuery) ||
    section.content.toLowerCase().includes(normalizedQuery)
  );
}
