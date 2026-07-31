// header scroll shadow
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 30 ? '0 4px 24px rgba(46,55,64,0.08)' : 'none';
  });

  // mobile burger menu
  const navBurger = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');

  function closeMenu(){
    navLinks.classList.remove('active');
    navBurger.setAttribute('aria-expanded','false');
    navBurger.textContent = '☰';
  }

  navBurger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('active');
    navBurger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    navBurger.textContent = isOpen ? '✕' : '☰';
  });

  // close menu after tapping a link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // close menu if resized back to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });