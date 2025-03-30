export const stripHtml = (html) => {
  if (typeof window === "undefined") return "";
  if (!html) return "";

  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const scripts = tempDiv.getElementsByTagName('script');
    for (const script of Array.from(scripts)) {
      script.remove();
    }

    const text = tempDiv.textContent || tempDiv.innerText || "";
    const lines = text.split(/\n/).filter(line => line.trim());
    const previewLines = lines.slice(0, 2);
    const preview = previewLines.join('\n');
    return preview + (lines.length > 2 ? '...' : '');
  } catch (error) {
    console.error('Error parsing HTML:', error);
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
};

export const getOrdinalSuffix = (day) => {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
};

export const formatDateTime = (dateInput) => {
  const date = new Date(dateInput || Date.now());
  const day = date.getDate();
  const ordinalDay = day + getOrdinalSuffix(day);
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${ordinalDay} ${month} ${year} | ${time}`;
};

export const getPageNumbers = (currentPage, totalPages) => {
  const pages = [];
  
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    
    if (currentPage > 3) {
      pages.push('...');
    }
    
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(currentPage + 1, totalPages - 1); i++) {
      pages.push(i);
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    
    pages.push(totalPages);
  }
  
  return pages;
}; 