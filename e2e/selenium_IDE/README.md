# Automated Testing via Selenium IDE
SeleniumHQ provides an IDE that allows you to create, record, and playback browser tests. 

## The Selenium IDE

SeleniumHQ offers :
* [Web extensions](https://www.seleniumhq.org/selenium-ide/) for Chrome and Firefox
* There is also a [command-line runner](https://www.seleniumhq.org/selenium-ide/docs/en/introduction/command-line-runner/) to run tests on any browser

### Loading Tests

 One you have downloaded the IDE and installed it in your browser, you should see a Selenium icon ![Selenium](./seleniumLogo.png) in the toolbar.
 
* Click on the Selenium icon in the browser toolbar to launch the IDE
* Upon launching the IDE a welcome dialog will be displayed with the following options:
  
  * Record a new test in a new project
  * Open an existing project
  * Create a new project
  * Close the IDE
  
  Select `Open an existing project`
  
* Navigate to the directory where the `.side` file is saved and open the file
* The tests will be displayed in the left panel of the IDE
 
 ### Running Tests
 
 ####Modify speed
 Before you began, it is strongly suggested to run the tests at a lower speed than the default top-speed. The reason for
 this is to avoid tests failing for components with slower load times. 
 
 * You will see a second toolbar in the IDE with a `clock` icon
 * Click on the icon to change the execution speed
 * You will see a slider to adjust from fast to slow
 * Setting the slider half-way between fast and slow should be sufficient.
  
 The speed can always be adjusted if you want to run the tests slower or faster
 
  ####Modify URL
  The tests have been set up to run on `http://localhost:4200/`. If this is not where you would like to run the tests, then the url will
  need to be modified. 
  
 The URL can be changed in the input box below the second toolbar. Simply replace `http://localhost:4200/` with the new URL. The IDE will
 save the URLs in case you would like to switch between them.
 
 ####Run tests
 Tests can be ran individually, together or as a suite. 
 
 * To run tests individually, make sure that `Tests` is selected in the left panel dropdown. Then click on the test you want to run. In the
 second toolbar, you will see a `play arrow` icon. Click on the icon to run the current test.
 
 * Running all tests will allow for a test to fail and the IDE continue to run the next test. That way, you can see the point
 of failure for each test. To run all of the tests together, click on the `play list` icon in the second toolbar.
 
 * Running tests as a suite will run the tests until a test fails and then, stop the run in order for you to address the failure. 
 To run a test suite, select `Test suites` in the left panel dropdown. Click the `plus` icon to add a suite. Once the suite is 
 created hover over the name of the suite. You will see a `menu` icon appear to the right of the name. Click on the icon and
 select the option, `Add tests`. You will see a pop-up that will allow you to select the tests you want to add to the suite. 
 Repeat the previous steps to run the entire test suite or one test in the suite.

 ###Exporting Tests
 To export the tests, hover over the name of the suite to display the `menu` icon. Click on the icon and
 select the option, `Export`. The tests can be exported in JAVA, JavaScript, or Python. Click the checkbox if 
 you would also like to export the test comments.
 
 To export an individual test, return to the `Tests` option in the left panel dropdown and repeat the previous instruction.
