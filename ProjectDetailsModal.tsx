import React from 'react';

const ProjectDetailsModal = ({ isOpen, onClose, details }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <button className="absolute top-0 right-0 p-2" onClick={onClose}>X</button>
        <h2>{details.title}</h2>
        <p>{details.description}</p>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;