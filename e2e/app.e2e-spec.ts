import { NeonGtdPage } from './app.po';

describe('neon-gtd App', function() {
  let page: NeonGtdPage;

  beforeEach(() => {
    page = new NeonGtdPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
