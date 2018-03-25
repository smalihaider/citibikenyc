'use strict';

/* https://github.com/angular/protractor/blob/master/docs/toc.md */

describe('my app', function() {


  it('should automatically redirect to /graph_view when location hash/fragment is empty', function() {
    browser.get('index.html');
    expect(browser.getLocationAbsUrl()).toMatch("/graph_view");
  });


  describe('graph_view', function() {

    beforeEach(function() {
      browser.get('index.html#!/graph_view');
    });


    it('should render graph_view when user navigates to /graph_view', function() {
      expect(element.all(by.css('[ng-view] p')).first().getText()).
        toMatch(/partial for view 1/);
    });

  });


  describe('map_widget', function() {

    beforeEach(function() {
      browser.get('index.html#!/map_widget');
    });


    it('should render map_widget when user navigates to /map_widget', function() {
      expect(element.all(by.css('[ng-view] p')).first().getText()).
        toMatch(/partial for view 2/);
    });

  });
});
