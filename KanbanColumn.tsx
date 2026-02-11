import React from 'react';

const KanbanColumn = ({ title, children }) => {
  return (
    <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-2">
      <div className="bg-white rounded-md shadow-md p-4">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        {children}
      </div>
    </div>
  );
};

export default KanbanColumn;