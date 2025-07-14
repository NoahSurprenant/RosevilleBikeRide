import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Inject, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import gsap from 'gsap';

@Component({
  selector: 'app-canvas',
  imports: [],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gsapBox', { static: false }) gsapBox!: ElementRef;
  @ViewChild('cyclist', { static: false }) cyclist!: ElementRef;
  @ViewChild('waves', { static: false }) waves!: ElementRef;

  stickmanColor = '#222';
  grassColor = '#3cb843ff';
  roadColor = '#333';
  roadDashColor = '#fff';
  waveColor = '#00bcd4';
  petalColor = '#e91e63';
  bikeColor = '#005f63ff';
  wheelColor = '#524c4cff';
  petals = Array.from({ length: 30 }, () => ({
    opacity: 0.8
  }));
  
  spokeAngles = [0,30,60,90,120,150,180,210,240,270,300,330];
  backSpokes = this.spokeAngles.map(a => ({
    x1: 25,
    y1: 65,
    x2: 25 + 14 * Math.cos(a * Math.PI / 180),
    y2: 65 + 14 * Math.sin(a * Math.PI / 180)
  }));
  frontSpokes = this.spokeAngles.map(a => ({
    x1: 75,
    y1: 65,
    x2: 75 + 14 * Math.cos(a * Math.PI / 180),
    y2: 65 + 14 * Math.sin(a * Math.PI / 180)
  }));

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.showDebugLabels = this.isBrowser && window.location.hostname === 'localhost';
    this.showDebugLabels = false;
  }
  isBrowser: boolean;
  private flipDirection = 1;

  private cyclistTween?: gsap.core.Tween;
  private wheelBackTween?: gsap.core.Tween;
  private wheelFrontTween?: gsap.core.Tween;
  private pedalsTween?: gsap.core.Tween;
  private thighLTween?: gsap.core.Tween;
  private thighRTween?: gsap.core.Tween;
  private waveTween?: gsap.core.Tween;
  private petalTweens: gsap.core.Tween[] = [];

  public pedalL = { x: 45, y: 61 };
  public pedalR = { x: 51, y: 69 };

  showDebugLabels: boolean;

  ngAfterViewInit() {
    if (!this.isBrowser) {
      return;
    }
    // Animate Cyclist (move along the road and flip with GSAP)
    if (this.cyclist) {
      const cyclistEl = this.cyclist.nativeElement;
      gsap.set(cyclistEl, { scaleX: 1, transformOrigin: '50% 50%' });
      this.cyclistTween = gsap.to(cyclistEl, {
        x: 400,
        duration: 12.8,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        onRepeat: () => {
          this.flipDirection *= -1;
          gsap.to(cyclistEl, { scaleX: this.flipDirection, transformOrigin: '50% 50%', duration: 0 });
        }
      });
      // Animate wheels and spokes spinning (rotate around wheel center, not SVG center)
      const wheelBack = this.cyclist.nativeElement.querySelector('#wheelBack');
      const wheelFront = this.cyclist.nativeElement.querySelector('#wheelFront');
      const spokesBack = this.cyclist.nativeElement.querySelector('#spokesBack');
      const spokesFront = this.cyclist.nativeElement.querySelector('#spokesFront');
      if (wheelBack && spokesBack) {
        this.wheelBackTween = gsap.to([wheelBack, spokesBack], {
          rotation: 360,
          svgOrigin: '25 65',
          duration: 2,
          repeat: -1,
          ease: 'linear',
        });
      }
      if (wheelFront && spokesFront) {
        this.wheelFrontTween = gsap.to([wheelFront, spokesFront], {
          rotation: 360,
          svgOrigin: '75 65',
          duration: 2,
          repeat: -1,
          ease: 'linear',
        });
      }
      // Animate pedals and feet together for perfect alignment with dynamic knee bend
      const pedals = this.cyclist.nativeElement.querySelector('#pedals');
      const thighL = this.cyclist.nativeElement.querySelector('#thighL');
      const shinL = this.cyclist.nativeElement.querySelector('#shinL');
      const footL = this.cyclist.nativeElement.querySelector('#footL');
      const thighR = this.cyclist.nativeElement.querySelector('#thighR');
      const shinR = this.cyclist.nativeElement.querySelector('#shinR');
      const footR = this.cyclist.nativeElement.querySelector('#footR');
      // Pedal path (circle, centered at 55,65, radius 13)
      if (pedals && thighL && shinL && footL && thighR && shinR && footR) {
        this.pedalsTween = gsap.to({}, {
          duration: 4,
          repeat: -1,
          ease: 'linear',
          onUpdate: function() {
            // @ts-ignore
            const t = this['progress']();
            // Pedal/crank center for animation
            const crankCenter = { x: 48, y: 65 };
            const pedalRadius = 5; // pedal arm length
            const angleL = Math.PI * 2 * t;
            const angleR = Math.PI * 2 * ((t + 0.5) % 1);
            // Left pedal and foot
            const cxL = crankCenter.x + pedalRadius * Math.cos(angleL + Math.PI);
            const cyL = crankCenter.y + pedalRadius * Math.sin(angleL + Math.PI);
            footL.setAttribute('cx', cxL.toFixed(2));
            footL.setAttribute('cy', cyL.toFixed(2));
            pedals.querySelector('#pedalL').setAttribute('x2', (crankCenter.x + pedalRadius * Math.cos(angleL + Math.PI)).toFixed(2));
            pedals.querySelector('#pedalL').setAttribute('y2', (crankCenter.y + pedalRadius * Math.sin(angleL + Math.PI)).toFixed(2));
            // Left shin and thigh for knee bend
            // Define hip and foot positions for both legs
            const hipX = 53, hipY = 45;
            // Calculate knee position as halfway between hip and foot, offset always downward and forward
            function getKneeBendOffset(hipX: number, hipY: number, footX: number, footY: number, bendY: number, bendX: number): [number, number] {
              const dx = footX - hipX;
              const dy = footY - hipY;
              const mx = hipX + dx * 0.5;
              const my = hipY + dy * 0.5;
              // Offset knee downward (positive y) and forward (positive x)
              return [mx + Math.abs(bendX), my + Math.abs(bendY)];
            }
            // Left knee
            const [kneeXL, kneeYL] = getKneeBendOffset(hipX, hipY, cxL, cyL, 3, 4);
            thighL.setAttribute('x2', kneeXL.toFixed(2));
            thighL.setAttribute('y2', kneeYL.toFixed(2));
            shinL.setAttribute('x1', kneeXL.toFixed(2));
            shinL.setAttribute('y1', kneeYL.toFixed(2));
            shinL.setAttribute('x2', cxL.toFixed(2));
            shinL.setAttribute('y2', cyL.toFixed(2));
            // Right pedal and foot
            const cxR = crankCenter.x + pedalRadius * Math.cos(angleR + Math.PI);
            const cyR = crankCenter.y + pedalRadius * Math.sin(angleR + Math.PI);
            footR.setAttribute('cx', cxR.toFixed(2));
            footR.setAttribute('cy', cyR.toFixed(2));
            pedals.querySelector('#pedalR').setAttribute('x2', (crankCenter.x + pedalRadius * Math.cos(angleR + Math.PI)).toFixed(2));
            pedals.querySelector('#pedalR').setAttribute('y2', (crankCenter.y + pedalRadius * Math.sin(angleR + Math.PI)).toFixed(2));
            // Right shin and thigh for knee bend
            const [kneeXR, kneeYR] = getKneeBendOffset(hipX, hipY, cxR, cyR, 3, 4);
            thighR.setAttribute('x2', kneeXR.toFixed(2));
            thighR.setAttribute('y2', kneeYR.toFixed(2));
            shinR.setAttribute('x1', kneeXR.toFixed(2));
            shinR.setAttribute('y1', kneeYR.toFixed(2));
            shinR.setAttribute('x2', cxR.toFixed(2));
            shinR.setAttribute('y2', cyR.toFixed(2));
          }
        });
      }
    }

    // Animate Petals (falling across the SVG canvas)
    setTimeout(() => {
      this.petals.forEach((petal, i) => {
        const petalEl = document.querySelectorAll('.petal')[i];
        if (petalEl) {
          const animatePetal = () => {
            const startX = this.randomBetween(0, 600);
            const endX = this.randomBetween(0, 600);
            const startY = this.randomBetween(-20, -60); // above canvas
            const endY = this.randomBetween(350, 380);
            //console.log(`Animating petal ${i}: startX=${startX}, endX=${endX}, startY=${startY}, endY=${endY}`);
            gsap.set(petalEl, { x: startX, y: startY, rotation: Math.random() * 360 });
            const tween = gsap.to(petalEl, {
              y: endY,
              x: endX,
              rotation: "+=" + (Math.random() < 0.5 ? 90 : -90), // gentle spin
              duration: this.randomBetween(12, 20),
              ease: 'sine.inOut',
              onComplete: () => {
                //console.log(`Petal ${i} completed animation`);
                animatePetal();
              }
            });
            this.petalTweens.push(tween);
          };
          animatePetal();
        }
      });
    }, 0);

    // Animate Waves (gentle wave motion)
    if (this.waves) {
      const wavePath = this.waves.nativeElement.querySelector('#wavePath');
      if (wavePath) {
        this.waveTween = gsap.to(wavePath, {
          attr: { d: 'M0,20 Q100,40 200,20 T400,20 T600,20 V40 H0 Z' }, // only y-values changed for wave effect
          duration: 2,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });
      }
    }
    
  }

  ngOnDestroy(): void {
    if (this.cyclistTween) this.cyclistTween.kill();
    if (this.wheelBackTween) this.wheelBackTween.kill();
    if (this.wheelFrontTween) this.wheelFrontTween.kill();
    if (this.pedalsTween) this.pedalsTween.kill();
    if (this.thighLTween) this.thighLTween.kill();
    if (this.thighRTween) this.thighRTween.kill();
    if (this.waveTween) this.waveTween.kill();
    this.petalTweens.forEach(tween => tween.kill());
    this.petalTweens = [];
  }

  private randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}
