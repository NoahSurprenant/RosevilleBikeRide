import { Component, Inject, NgZone, OnDestroy, OnInit, PLATFORM_ID, signal, AfterViewInit } from '@angular/core';
import { CanvasComponent } from "./canvas/canvas.component";
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

@Component({
  selector: 'app-root',
  imports: [CanvasComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, AfterViewInit, OnDestroy {
  protected readonly title = signal('roseville-bike-ride');
  private resizeHandler = () => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    // Not setting height because it seems to cause extra space below cyclist svg
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private ngZone: NgZone) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
  isBrowser: boolean;

  private infoTween?: gsap.core.Tween;
  private ctaTween?: gsap.core.Tween;
  private heroGradientTween?: gsap.core.Tween;
  private infoGradientTween?: gsap.core.Tween;
  private ctaGradientTween?: gsap.core.Tween;
  private infoTypewriterTween?: gsap.core.Tween;
  private ctaTypewriterTween?: gsap.core.Tween;
  private heroConicTween?: gsap.core.Tween;

  ngOnInit() {
    if (!this.isBrowser) {
      return;
    }
    window.addEventListener('resize', this.resizeHandler);
    this.resizeHandler();
  }

  ngAfterViewInit() {
    if (!this.isBrowser) {
      return;
    }
    this.ngZone.runOutsideAngular(() => {
      gsap.registerPlugin(ScrollTrigger);
      gsap.registerPlugin(TextPlugin);
      // Animate hero-section conic-gradient rotation
      this.heroConicTween = gsap.to('.hero-bg', {
        rotation: 360,
        transformOrigin: '50% 50%',
        duration: 30,
        repeat: -1,
        ease: 'linear',
      });
      // Animate info section on scroll
      this.infoTween = gsap.from('#infoSection', {
        y: 60,
        opacity: 0,
        duration: 1.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#infoSection',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
      // Typewriter effect for info-section heading
      const infoHeading = document.querySelector('#infoSection h2');
      if (infoHeading) infoHeading.textContent = '';
      this.infoTypewriterTween = gsap.to('#infoSection h2', {
        text: 'Meetup Details',
        duration: 2.2,
        ease: 'none',
        scrollTrigger: {
          trigger: '#infoSection',
          start: 'top 80%',
          toggleActions: 'play none none none',
        }
      });
      // Animate CTA section on scroll
      this.ctaTween = gsap.from('#ctaSection', {
        scale: 0.8,
        opacity: 0,
        duration: 1.1,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: '#ctaSection',
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
      // Typewriter effect for CTA-section heading
      const ctaHeading = document.querySelector('#ctaSection h2');
      if (ctaHeading) ctaHeading.textContent = '';
      this.ctaTypewriterTween = gsap.to('#ctaSection h2', {
        text: 'Join Us!',
        duration: 2.2,
        ease: 'none',
        scrollTrigger: {
          trigger: '#ctaSection',
          start: 'top 80%',
          toggleActions: 'play none none none',
        }
      });
      this.infoGradientTween = gsap.to('.info-section', {
        backgroundPosition: '0% 200%',
        duration: 30,
        repeat: -1,
        ease: 'linear'
      });
      this.ctaGradientTween = gsap.to('.cta-section', {
        backgroundPosition: '200% 0%',
        duration: 30,
        repeat: -1,
        ease: 'linear'
      });
    });
  }

  ngOnDestroy() {
    if (!this.isBrowser) {
      return;
    }
    window.removeEventListener('resize', this.resizeHandler);
    if (this.heroConicTween) this.heroConicTween.kill();
    if (this.infoTween) this.infoTween.kill();
    if (this.ctaTween) this.ctaTween.kill();
    if (this.heroGradientTween) this.heroGradientTween.kill();
    if (this.infoGradientTween) this.infoGradientTween.kill();
    if (this.ctaGradientTween) this.ctaGradientTween.kill();
    if (this.infoTypewriterTween) this.infoTypewriterTween.kill();
    if (this.ctaTypewriterTween) this.ctaTypewriterTween.kill();
  }
}
