export const INITIAL_DATA = {
  staff: [
    { id: 1, name: 'Alice Johnson', email: 'alice@company.com', role: 'Admin' },
    { id: 2, name: 'Bob Smith', email: 'bob@company.com', role: 'Staff' },
  ],
  tasks: [
    { id: 101, title: 'Fix Login Bug', status: 'Pending' },
    { id: 102, title: 'Update Homepage', status: 'In Progress' },
    { id: 103, title: 'Database Backup', status: 'Completed' },
  ],
  roles: [
    { id: 1, name: 'Admin', permissionIds: [1, 2, 3, 4] },
    { id: 2, name: 'Staff', permissionIds: [1] },
  ],
  permissions: [
    { id: 1, operationName: 'View Tasks', value: 'view_task', status: 'Active' },
    { id: 2, operationName: 'Edit Tasks', value: 'edit_task', status: 'Active' },
    { id: 3, operationName: 'Delete Tasks', value: 'delete_task', status: 'In Progress' },
    { id: 4, operationName: 'Manage Staff', value: 'manage_staff', status: 'Active' },
  ]
};