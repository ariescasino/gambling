import { Component } from '@angular/core';

@Component({
  selector: 'app-popular-matches',
  templateUrl: './popular-matches.component.html',
  styleUrls: ['./popular-matches.component.css'],
})
export class PopularMatchesComponent {
  activeCategory = 'Soccer';

  categories = [
    { label: 'Soccer', icon: '⚽' },
    { label: 'Basketball', icon: '🏀' },
    { label: 'Tennis', icon: '🎾' },
    { label: 'eSoccer', icon: '🎮' },
    { label: 'eBasketball', icon: '📱' },
    { label: 'eSoccer: Volta', icon: '⚡' },
    { label: 'Baseball', icon: '⚾' },
    { label: 'Ice Hockey', icon: '🏒' },
  ];

  matches = [
    {
      league: 'Colombia • Primera A, Clausura',
      date: 'Tomorrow',
      time: '02:10',
      team1: 'Millonarios FC',
      team2: 'Llaneros FC',
      team1Flag: 'assets/images/sports/team1.png',
      team2Flag: 'assets/images/sports/team2.png',
      odds: {
        '1': '1.45',
        draw: '4.0',
        '2': '7.6',
        '1 or draw': '1.08',
        '1 or 2': '1.21',
        'draw or 2': '2.65',
        'over 2.5': '2.08',
        'under 2.5': '1.69',
      },
    },
    {
      league: 'International • ASEAN Championship U23',
      date: 'Today',
      time: '14:00',
      team1: 'Philippines',
      team2: 'Thailand',
      team1Flag: 'assets/images/sports/team1.png',
      team2Flag: 'assets/images/sports/team2.png',
      odds: {
        '1': '5.8',
        draw: '4.2',
        '2': '1.46',
        '1 or draw': '2.48',
        '1 or 2': '1.14',
        'draw or 2': '1.07',
        'over 2.5': '1.61',
        'under 2.5': '2.16',
      },
    },
    {
      league: 'International • ASEAN Championship U23',
      date: 'Today',
      time: '14:00',
      team1: 'Philippines',
      team2: 'Thailand',
      team1Flag: 'assets/images/sports/team1.png',
      team2Flag: 'assets/images/sports/team2.png',
      odds: {
        '1': '5.8',
        draw: '4.2',
        '2': '1.46',
        '1 or draw': '2.48',
        '1 or 2': '1.14',
        'draw or 2': '1.07',
        'over 2.5': '1.61',
        'under 2.5': '2.16',
      },
    },
    {
      league: 'International • ASEAN Championship U23',
      date: 'Today',
      time: '14:00',
      team1: 'Philippines',
      team2: 'Thailand',
      team1Flag: 'assets/images/sports/team1.png',
      team2Flag: 'assets/images/sports/team2.png',
      odds: {
        '1': '5.8',
        draw: '4.2',
        '2': '1.46',
        '1 or draw': '2.48',
        '1 or 2': '1.14',
        'draw or 2': '1.07',
        'over 2.5': '1.61',
        'under 2.5': '2.16',
      },
    },
    {
      league: 'International • ASEAN Championship U23',
      date: 'Today',
      time: '14:00',
      team1: 'Philippines',
      team2: 'Thailand',
      team1Flag: 'assets/images/sports/team1.png',
      team2Flag: 'assets/images/sports/team2.png',
      odds: {
        '1': '5.8',
        draw: '4.2',
        '2': '1.46',
        '1 or draw': '2.48',
        '1 or 2': '1.14',
        'draw or 2': '1.07',
        'over 2.5': '1.61',
        'under 2.5': '2.16',
      },
    },
    {
      league: 'International • ASEAN Championship U23',
      date: 'Today',
      time: '14:00',
      team1: 'Philippines',
      team2: 'Thailand',
      team1Flag: 'assets/images/sports/team1.png',
      team2Flag: 'assets/images/sports/team2.png',
      odds: {
        '1': '5.8',
        draw: '4.2',
        '2': '1.46',
        '1 or draw': '2.48',
        '1 or 2': '1.14',
        'draw or 2': '1.07',
        'over 2.5': '1.61',
        'under 2.5': '2.16',
      },
    },
  ];

  selectCategory(category: any) {
    this.activeCategory = category.label;
    // You can filter matchData based on this
  }
}
