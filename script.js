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

  // savings calculator (only runs on pages that have it)
  const calcButton = document.getElementById('calcButton');
  if (calcButton) {
    const toggleBtns = document.querySelectorAll('.calc-toggle-btn');
    const hostingField = document.getElementById('calcHostingField');
    let hasWebsite = true;

    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toggleBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        hasWebsite = btn.dataset.website === 'yes';
        hostingField.style.display = hasWebsite ? '' : 'none';
        if (!hasWebsite) document.getElementById('calcHosting').value = '';
      });
    });

    const fmt = (n) => '£' + Math.round(n).toLocaleString('en-GB');

    // Conservative recovery estimates — we'd still charge something ongoing
    // for hosting/support, and automation rarely removes 100% of admin time.
    // These are deliberately rough, explained in the disclaimer text.
    const HOSTING_RECOVERY = 0.5;   // ~50% typical saving vs overpriced hosting
    const SOFTWARE_RECOVERY = 0.5;  // ~50% typical saving after consolidating tools
    const TIME_RECOVERY = 0.7;      // most, not all, admin time gets freed up

    calcButton.addEventListener('click', () => {
      const hosting = parseFloat(document.getElementById('calcHosting').value) || 0;
      const software = parseFloat(document.getElementById('calcSoftware').value) || 0;
      const hours = parseFloat(document.getElementById('calcHours').value) || 0;
      const rate = parseFloat(document.getElementById('calcRate').value) || 0;

      const annualHosting = hasWebsite ? hosting * 12 * HOSTING_RECOVERY : 0;
      const annualSoftware = software * 12 * SOFTWARE_RECOVERY;
      const annualTime = hours * 52 * rate * TIME_RECOVERY;
      const total = annualHosting + annualSoftware + annualTime;

      document.getElementById('calcTotal').textContent = fmt(total);
      document.getElementById('calcHostingOut').textContent = fmt(annualHosting) + '/yr';
      document.getElementById('calcSoftwareOut').textContent = fmt(annualSoftware) + '/yr';
      document.getElementById('calcTimeOut').textContent = fmt(annualTime) + '/yr';

      const hostingRow = document.getElementById('calcHostingRow');
      hostingRow.style.display = hasWebsite ? '' : 'none';

      const websiteNote = document.getElementById('calcWebsiteNote');
      if (!hasWebsite) {
        websiteNote.textContent = "Plus, since you don't have a website yet, you're likely missing customers who search online before they buy — that's on top of the above.";
        websiteNote.classList.add('is-visible');
      } else {
        websiteNote.classList.remove('is-visible');
        websiteNote.textContent = '';
      }

      document.getElementById('calcPlaceholder').classList.add('is-hidden');
      document.getElementById('calcOutput').classList.add('is-visible');
    });
  }