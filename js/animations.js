// animations.js
// Simple utility to trigger Animate.css animations when elements scroll into view.
// Elements that should animate must have a `data-animate` attribute specifying the Animate.css name (without the 'animate__' prefix).
// Example: <div class="glass-card" data-animate="fadeInUp">...</div>

document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const animation = el.dataset.animate || 'fadeInUp';
        el.classList.add('animate__animated', `animate__${animation}`);
        // Stop observing after the animation is applied
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.15 });

  // Observe all elements that declare a data-animate attribute
  document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
});
