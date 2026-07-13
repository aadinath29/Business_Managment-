import apiClient from './apiClient';

export const reportsApi = {
  getBranchSnapshot: async () => {
    const response = await apiClient.get('/reports/branches');
    return response.data.data;
  },
  
  downloadBranchSnapshotExcel: async () => {
    const response = await apiClient.get('/reports/branches/download', {
      responseType: 'blob' // Important for file download
    });
    
    // Create a Blob from the response data
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from Content-Disposition if present, or use default
    let fileName = 'branch_snapshot.xlsx';
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) {
        fileName = matches[1].replace(/['"]/g, '');
      }
    }
    
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
