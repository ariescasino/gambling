import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sports-sidebar',
  templateUrl: './sports-sidebar.component.html',
  styleUrls: ['./sports-sidebar.component.css'],
})
export class SportsSidebarComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}

  activeTab = 'Sports';

  setTab(tab: string) {
    this.activeTab = tab;
  }

  banners = [
    {
      title: 'Basketball',
      subtitle: 'NBA',
      image: '../../../assets/images/sports/USA.svg',
    },
    {
      title: 'eBasketball: Blitz',
      subtitle: 'NBA (1 min play)',
      image: '../../../assets/images/sports/USA.svg',
    },
    {
      title: 'eBasketball: Blitz',
      subtitle: 'NBA (1 min play)',
      image: '../../../assets/images/sports/USA.svg',
    },
    // Add more if needed
  ];

  leagues = [
    {
      country: 'Soccer USA',
      name: 'MLS',
      flag: '../../../assets/images/sports/USA.svg',
    },
    {
      country: 'Soccer England',
      name: 'Premier League',
      flag: '../../../assets/images/sports/ENG.svg',
    },
    {
      country: 'Succer Spain',
      name: 'LaLiga',
      flag: '../../../assets/images/sports/ESP.svg',
    },
  ];

  sports = [
    { label: 'Soccer', icon: '⚽', count: 953 },
    { label: 'eSoccer', icon: '🔥', count: 120 },
    { label: 'Basketball', icon: '🏀', count: 45 },
    { label: 'Tennis', icon: '🎾', count: 95 },
    { label: 'Baseball', icon: '⚡', count: 19 },
    { label: 'eBasketball', icon: '⚡', count: 50 },
    { label: 'Chess', icon: '⚡', count: 13 },
    { label: 'Volleyball', icon: '⚡', count: 43 },
  ];
}
