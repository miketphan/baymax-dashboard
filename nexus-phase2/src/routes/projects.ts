// Projects API Routes

import type { Env, Project, CreateProjectRequest, UpdateProjectRequest, UpdateProjectStatusRequest } from '../types';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../lib/db';
import {
  successResponse,
  errors,
  validateProjectTitle,
  isValidProjectStatus,
  isValidPriority,
  generateProjectId,
  sanitizeString,
} from '../lib/utils';

// ============================================
// GET /api/projects - List all projects
// ============================================
export async function listProjects(env: Env): Promise<Response> {
  const projects = await getAllProjects(env.DB);
  return successResponse({ projects });
}

// ============================================
// GET /api/projects/:id - Get a single project
// ============================================
export async function getProject(env: Env, id: string): Promise<Response> {
  const project = await getProjectById(env.DB, id);
  
  if (!project) {
    return errors.notFound('Project');
  }
  
  return successResponse(project);
}

// ============================================
// POST /api/projects - Create a new project
// ============================================
export async function createNewProject(env: Env, request: Request): Promise<Response> {
  let body: CreateProjectRequest;
  
  try {
    body = await request.json() as CreateProjectRequest;
  } catch {
    return errors.badRequest('Invalid JSON in request body');
  }
  
  // Validate required fields
  const titleError = validateProjectTitle(body.title);
  if (titleError) {
    return errors.validationError({ field: 'title', message: titleError });
  }
  
  // Validate optional fields
  if (body.status && !isValidProjectStatus(body.status)) {
    return errors.validationError({
      field: 'status',
      message: `Status must be one of: backlog, in_progress, done, archived`,
    });
  }
  
  if (body.priority && !isValidPriority(body.priority)) {
    return errors.validationError({
      field: 'priority',
      message: `Priority must be one of: low, medium, high`,
    });
  }
  
  // Create the project
  const projectData: Omit<Project, 'created_at' | 'updated_at'> = {
    id: generateProjectId(),
    title: sanitizeString(body.title)!,
    description: sanitizeString(body.description),
    status: body.status ?? 'backlog',
    priority: body.priority ?? 'medium',
    sort_order: body.sort_order ?? 0,
    metadata: body.metadata,
  };
  
  try {
    const project = await createProject(env.DB, projectData);
    return successResponse(project);
  } catch (error) {
    console.error('Failed to create project:', error);
    return errors.internalError('Failed to create project');
  }
}

// ============================================
// PUT /api/projects/:id - Update a project
// ============================================
export async function updateExistingProject(
  env: Env,
  id: string,
  request: Request
): Promise<Response> {
  // Check if project exists
  const existing = await getProjectById(env.DB, id);
  if (!existing) {
    return errors.notFound('Project');
  }
  
  let body: UpdateProjectRequest;
  
  try {
    body = await request.json() as UpdateProjectRequest;
  } catch {
    return errors.badRequest('Invalid JSON in request body');
  }
  
  // Validate fields if provided
  if (body.title !== undefined) {
    const titleError = validateProjectTitle(body.title);
    if (titleError) {
      return errors.validationError({ field: 'title', message: titleError });
    }
  }
  
  if (body.status && !isValidProjectStatus(body.status)) {
    return errors.validationError({
      field: 'status',
      message: `Status must be one of: backlog, in_progress, done, archived`,
    });
  }
  
  if (body.priority && !isValidPriority(body.priority)) {
    return errors.validationError({
      field: 'priority',
      message: `Priority must be one of: low, medium, high`,
    });
  }
  
  // Build updates
  const updates: UpdateProjectRequest = {};
  
  if (body.title !== undefined) updates.title = sanitizeString(body.title)!;
  if (body.description !== undefined) updates.description = sanitizeString(body.description);
  if (body.status !== undefined) updates.status = body.status;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  if (body.metadata !== undefined) updates.metadata = body.metadata;
  
  try {
    const project = await updateProject(env.DB, id, updates);
    if (!project) {
      return errors.internalError('Failed to update project');
    }
    return successResponse(project);
  } catch (error) {
    console.error('Failed to update project:', error);
    return errors.internalError('Failed to update project');
  }
}

// ============================================
// PATCH /api/projects/:id/status - Quick status update
// ============================================
export async function updateProjectStatus(
  env: Env,
  id: string,
  request: Request
): Promise<Response> {
  // Check if project exists
  const existing = await getProjectById(env.DB, id);
  if (!existing) {
    return errors.notFound('Project');
  }
  
  let body: UpdateProjectStatusRequest;
  
  try {
    body = await request.json() as UpdateProjectStatusRequest;
  } catch {
    return errors.badRequest('Invalid JSON in request body');
  }
  
  // Validate status
  if (!body.status || !isValidProjectStatus(body.status)) {
    return errors.validationError({
      field: 'status',
      message: `Status is required and must be one of: backlog, in_progress, done, archived`,
    });
  }
  
  try {
    const project = await updateProject(env.DB, id, { status: body.status });
    if (!project) {
      return errors.internalError('Failed to update project status');
    }
    return successResponse(project);
  } catch (error) {
    console.error('Failed to update project status:', error);
    return errors.internalError('Failed to update project status');
  }
}

// ============================================
// DELETE /api/projects/:id - Delete a project
// ============================================
export async function deleteExistingProject(env: Env, id: string): Promise<Response> {
  // Check if project exists
  const existing = await getProjectById(env.DB, id);
  if (!existing) {
    return errors.notFound('Project');
  }
  
  try {
    const deleted = await deleteProject(env.DB, id);
    if (!deleted) {
      console.error(`Delete returned false for project ${id}`);
      return errors.internalError('Failed to delete project - no rows affected');
    }
    return successResponse({ deleted: true, id });
  } catch (error) {
    console.error('Failed to delete project:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return errors.internalError(`Failed to delete project: ${errorMessage}`);
  }
}
