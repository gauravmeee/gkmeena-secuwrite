// Function to strip HTML tags for preview
export const stripHtml = (html) => {
  if (typeof window === 'undefined') return '';
  if (!html) return '';
  
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}; 
