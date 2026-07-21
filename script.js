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

  // website pricing toggle
  const priceToggleBtns = document.querySelectorAll('.price-toggle-btn');
  const websitePriceDisplay = document.getElementById('websitePriceDisplay');
  const websitePriceNote = document.getElementById('websitePriceNote');

  const pricePlans = {
    monthly: {
      html: `<div class="price-tag"><span class="amount">£19.99</span><span class="period">/month</span></div>`,
      note: 'No upfront cost — just £19.99 a month, cancel any time.'
    },
    upfront: {
      html: `<div class="price-tag"><span class="amount">£499</span><span class="period">upfront</span></div>
             <div class="price-tag"><span class="from">+</span><span class="amount" style="font-size:20px;">£9.99</span><span class="period">/month</span></div>`,
      note: 'One-off £499 build fee, then just £9.99 a month.'
    }
  };

  priceToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      priceToggleBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const plan = pricePlans[btn.dataset.plan];
      websitePriceDisplay.innerHTML = plan.html;
      websitePriceNote.textContent = plan.note;
    });
  });