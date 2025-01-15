import React from 'react';

export const HeapManagementGuide = () => {
  return (
    <div className="heap-management-guide map-3d-sidebar-content">
      <ul>
        <li>
          <span> Step 1 - </span> <p> Go to the Draw tab </p>
        </li>
        <li>
          <span> Step 2 - </span> <p>Draw a polygon along desired heap</p>
        </li>
        <li>
          <span> Step 3 - </span> <p>Fill in the attributes</p>
        </li>
        <li>
          <span> Step 4 - </span> <p> Press {`"Add Heap"`} to confirm </p>
        </li>
        <li>
          <span> Step 5 - </span>
          <p>
            Wait for system to save and process your request. Your processed
            request will be availabe always when you login in the {`"List Tab"`}
          </p>
        </li>
      </ul>
    </div>
  );
};
