type ExpandFooterLink = {
  [headline: string]: Array<
    { name: string } & (
      | {
          name: string;
          path: string;
          ref: 'external' | 'internal';
        }
      | { ref: '_blank' }
    )
  >;
};
const expandedFooterLink: ExpandFooterLink = {
  support: [
    { name: 'Help center', ref: '_blank' },
    { name: 'Aircover', ref: '_blank' },
    { name: 'Safety information', ref: '_blank' },
    { name: 'Supporting people with disabilities', ref: '_blank' },
    { name: 'Cancellation options', ref: '_blank' },
    { name: 'Our COVID-19 Response', ref: '_blank' },
    { name: 'Report a neighbourhood concern', ref: '_blank' },
  ],

  community: [
    { name: 'Airbnb.org: disaster relief housing', ref: '_blank' },
    { name: 'Support Afghan refugees', ref: '_blank' },
    { name: 'Combating discrimination', ref: '_blank' },
  ],

  hosting: [
    { name: 'Try hosting', ref: '_blank' },
    { name: 'AirCover for Hosts', ref: '_blank' },
    { name: 'Explore hosing resoureces', ref: '_blank' },
    { name: 'Visit our community forum', ref: '_blank' },
    { name: 'How to host reponsibily', ref: '_blank' },
  ],

  airbnb: [
    { name: 'Newsroom', ref: '_blank' },
    { name: 'Learn about new features', ref: '_blank' },
    { name: 'Letter from our founders', ref: '_blank' },
    { name: 'Careers', ref: '_blank' },
    { name: 'Investors', ref: '_blank' },
    { name: 'GiftCards', ref: '_blank' },
  ],
};

export { expandedFooterLink };
