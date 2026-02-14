// Photo Gallery Configuration - Custom Order
const photos = [
    // 🏕️ OUTDOOR/LIFESTYLE
    "Photos/Tommy-og-photos/240322105621-tcv-reese.jpg",
    "Photos/Tommy-og-photos/240322105632-tcv-reese.jpg",
    "Photos/Tommy-og-photos/240322105650-tcv-reese.jpg",
    "Photos/Tommy-og-photos/240322105704-tcv-reese.jpg",
    "Photos/IMG_1070 (1).jpg",
    "Photos/IMG_1674 (1).jpg",
    "Photos/IMG_1861 (1).jpg",
    "Photos/IMG_1594 (1).jpg",
    "Photos/IMG_1420.jpg",

    // 🚐 EXTERIOR
    "Photos/IMG_4772.jpg",
    "Photos/IMG_4771.jpg",
    "Photos/IMG_4769.jpg",
    "Photos/IMG_4775.jpg",
    "Photos/IMG_4777 (1).jpg",
    "Photos/IMG_4778.jpg",
    "Photos/IMG_2212.jpg",
    "Photos/IMG_4765.jpg",
    "Photos/IMG_4766.jpg",
    "Photos/IMG_4767.jpg",
    "Photos/IMG_4768 (1).jpg",
    "Photos/IMG_4779.jpg",
    "Photos/IMG_4780.jpg",
    "Photos/IMG_4781.jpg",
    "Photos/IMG_4782.jpg",
    "Photos/IMG_4817.jpg",
    "Photos/IMG_4770.jpg",
    "Photos/IMG_4818.jpg",
    "Photos/IMG_4774.jpg",

    // 🏠 INTERIOR
    "Photos/Tommy-og-photos/240322110615-tcv-reese-2.jpg",
    "Photos/IMG_4792.jpg",
    "Photos/IMG_4761 (1).jpg",
    "Photos/IMG_4762.jpg",
    "Photos/IMG_4763.jpg",
    "Photos/IMG_4793.jpg",
    "Photos/IMG_4794.jpg",
    "Photos/IMG_4795.jpg",
    "Photos/IMG_4797.jpg",
    "Photos/IMG_4799.jpg",
    "Photos/IMG_4798.jpg",
    "Photos/IMG_4796.jpg",
    "Photos/IMG_4800.jpg",
    "Photos/IMG_1586 (1).jpg",
    "Photos/Tommy-og-photos/240322110201-tcv-reese-4-HDR.jpg",
    "Photos/Tommy-og-photos/240322110149-tcv-reese-3-HDR.jpg",
    "Photos/Tommy-og-photos/240322110209-tcv-reese-3-HDR.jpg",
    "Photos/Tommy-og-photos/240322110040-tcv-reese-2-HDR.jpg",
    "Photos/Tommy-og-photos/240322110114-tcv-reese-3-HDR.jpg",
    "Photos/Tommy-og-photos/240322110133-tcv-reese-HDR.jpg",
    "Photos/IMG_4807.jpg",
    "Photos/IMG_4805.jpg",
    "Photos/Tommy-og-photos/240322110140-tcv-reese-HDR.jpg",
    "Photos/IMG_4806.jpg",
    "Photos/IMG_4804 (1).jpg",
    "Photos/Tommy-og-photos/240322110047-tcv-reese-3-HDR.jpg",
    "Photos/IMG_4808.jpg",
    "Photos/IMG_4813.jpg",
    "Photos/IMG_4814.jpg",
    "Photos/IMG_4759.jpg",
    "Photos/IMG_4785 (1).jpg",
    "Photos/IMG_4758.jpg",
    "Photos/IMG_4760.jpg",
    "Photos/IMG_4784.jpg"
];

// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

mobileMenuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    mobileMenuToggle.classList.toggle('active');
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
    });
});

// Gallery Functionality
let currentImageIndex = 0;

function loadGallery() {
    const galleryGrid = document.getElementById('galleryGrid');

    photos.forEach((photo, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.innerHTML = `<img src="${photo}" alt="Van photo ${index + 1}" loading="lazy">`;
        galleryItem.addEventListener('click', () => openLightbox(index));
        galleryGrid.appendChild(galleryItem);
    });
}

function openLightbox(index) {
    currentImageIndex = index;
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCounter = document.getElementById('lightboxCounter');

    lightboxImage.src = photos[currentImageIndex];
    lightboxCounter.textContent = `${currentImageIndex + 1} / ${photos.length}`;
    lightbox.classList.add('active');

    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % photos.length;
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCounter = document.getElementById('lightboxCounter');

    lightboxImage.src = photos[currentImageIndex];
    lightboxCounter.textContent = `${currentImageIndex + 1} / ${photos.length}`;
}

function prevImage() {
    currentImageIndex = (currentImageIndex - 1 + photos.length) % photos.length;
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCounter = document.getElementById('lightboxCounter');

    lightboxImage.src = photos[currentImageIndex];
    lightboxCounter.textContent = `${currentImageIndex + 1} / ${photos.length}`;
}

// Lightbox Event Listeners
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightboxNext').addEventListener('click', nextImage);
document.getElementById('lightboxPrev').addEventListener('click', prevImage);

// Close lightbox when clicking outside the image
document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') {
        closeLightbox();
    }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox.classList.contains('active')) {
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowRight') {
            nextImage();
        } else if (e.key === 'ArrowLeft') {
            prevImage();
        }
    }
});

// Touch swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;

document.getElementById('lightbox').addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

document.getElementById('lightbox').addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
        // Swiped left - next image
        nextImage();
    }
    if (touchEndX > touchStartX + swipeThreshold) {
        // Swiped right - previous image
        prevImage();
    }
}

// Smooth scroll behavior for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = target.offsetTop - navHeight;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Add fade-in animation to elements
document.addEventListener('DOMContentLoaded', () => {
    loadGallery();

    // Observe elements for animations
    const animatedElements = document.querySelectorAll('.highlight-card, .feature-item, .spec-card, .gallery-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = 'rgba(50, 50, 50, 1)';
    } else {
        navbar.style.backgroundColor = 'rgba(50, 50, 50, 0.95)';
    }
});
