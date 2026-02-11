import React from 'react';

const ProjectCard = ({ title, description }) => {
  return (
    <div className="bg-gray-100 rounded-md p-4 mb-2">
      <h3 className="text-md font-semibold">{title}</h3>
      <p className="text-sm">{description}</p>
    </div>
  );
};

export default ProjectCard;