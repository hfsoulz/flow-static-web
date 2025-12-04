/* luflow.net web site */
/* Public domain 2025. All rights waived */

// handle menu toggle while in mobile (or smaller) type screens:
let menuToggle = document.querySelector('.menuToggle');
let header = document.querySelector('header');
menuToggle.onclick = function () {
    header.classList.toggle('active');
};
