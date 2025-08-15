import { Component } from '@angular/core';
import { OwlOptions } from 'ngx-owl-carousel-o';

@Component({
  selector: 'app-highlight-live-sport',
  templateUrl: './highlight-live-sport.component.html',
  styleUrls: ['./highlight-live-sport.component.scss'],
})
export class HighlightLiveSportsComponent {
  customOptions1: OwlOptions = {
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: false,
    autoplay: true,
    dots: true,
    autoplayTimeout: 5000,
    autoplayHoverPause: true,

    margin: 10,
    navSpeed: 1000,

    navText: ['', ''],
    responsive: {
      0: { items: 1 },
      600: { items: 1 },
      740: { items: 3 },
      940: { items: 3 },
    },
    nav: false,
  };
  matches = [
    {
      category: 'Soccer • MLS',
      isLive: true,
      home: {
        name: 'New England Revolution',
        logo: 'assets/images/teams/2511.png',
      },
      away: {
        name: 'CF Montreal',
        logo: 'assets/images/teams/2504.png',
      },
      score: '1 : 2',
      status: 'Halftime',
      odds: { home: 3.5, draw: 3.35, away: 2.15 },
      extra: '+2',
    },
    {
      category: 'Soccer • MLS',
      isLive: true,
      home: {
        name: 'Columbus Crew',
        logo: 'assets/images/teams/22006.png',
      },
      away: {
        name: 'Orlando City SC',
        logo: 'assets/images/teams/52237.png',
      },
      score: '0 : 0',
      status: 'Not started',
      odds: { home: 2.2, draw: 3.55, away: 3.15 },
      extra: '+2',
    },
    {
      category: 'eSoccer • Premier League (2x6 min)',
      isLive: true,
      home: {
        name: 'Chelsea FC',
        logo: 'assets/images/teams/2344949089407475734.png',
      },
      away: {
        name: 'Manchester City',
        logo: 'assets/images/teams/2344901826840764434.png',
      },
      score: '0 : 0',
      status: '1st half',
      odds: { home: 5.0, draw: 2.95, away: 1.75 },
      extra: '+1',
    },
  ];
}
