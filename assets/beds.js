'use strict';
document.addEventListener('DOMContentLoaded', () => {
  // Место под локальную инициализацию при необходимости
});
document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.article-card').forEach(card => observer.observe(card));
});
