# OuterSpaced
OuterSpaced is solar system physics simulation software that runs in the web browser.

## Disclaimer
__The "Software" means this software and associated documentation files.__
__THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.__

## Documentation
  ### Installation
  1. Install the Google Chrome web browser. While other browsers may work, OuterSpaced was developed and tested with Chrome.
  1. Clone or download the OuterSpaced software source code (this repository) into a folder on your machine.
  1. Open the file __simulator.html__ in Google Chrome to run the software in the browser window.

  ### Getting Started
  1. Click and drag the mouse in the empty space in the center of the page to create a new planet and give momentum to it proportional to the distance you drag the mouse. 
  1. On the right hand toolbar, hold down the __+__ icon under the __Mass__ section for around a second to increase the mass of the next object you will add.
  1. Click the mouse again in the empty space to add the new, more massive planet / star. 

  ### Button and Hotkey List
  OuterSpaced responds to button clicks and hotkeys. 
  - #### Tools Section
    - [__&rarr;__] __:__ While this tool is selected, click and drag on the page to add a new planet with momentum proportional to the distance dragged.
    - [__&orarr;__] __:__ While this tool is selected, click to add a planet to orbit the system's center of mass.

  - #### Zoom Section
    - [__&ndash;__], Q key __:__ Zoom the camera out.
    - [__+__], P key __:__ Zoom the camera in.

  - #### Move Section
    - [__&#8678;, &#8679;, &#8680;, &#8681;__], arrow keys __:__ Move the camera in the direction indicated by the button.

  - #### State Section
    - [__&#8678;__] __:__ Go backward in simulation state history.
    - [__&#8680;__] __:__ Go forward in simulation state history.
    - [__&orarr;__] __:__ Reload current simulation state. This is good for 'instant replays' of something interesting, like a collision or gravitational slingshot. 
    - [__x__] __:__ Clear simulation state. This clears all planets.

  - #### Time Section
    - [__&ndash;__] __:__ Slow down the simulation. This reduces the simulation's deviation from actual motion by reducing the step size used to solve the differential equations of motion.
    - [__+__] __:__ Speed up the simulation. This increases the simulation's deviation from actual motion by increasing the step size used to solve the differential equations of motion.

  - #### Mass Section
    - [__&ndash;__] __:__ Reduce the mass of the next planet to be added.
    - [__+__] __:__ Increase the mass of the next planet to be added. If the mass is high enough, the object will be a star instead of a planet.

  - #### Show Section
    - [__F__] __:__ Show the net force vector on each object. 
    - [__V__] __:__ Show the velocity vector on each object. For circular orbits, notice that the force and velocity vectors are orthogonal.
    - [__&#x2299;__] __:__ Show the paths taken by objects as they move. This lets you more clearly see what your planets' orbits look like, and helps visualize that the sun is located in one of the foci of an elliptical orbit. 
    - [__&#x25D5;__] __:__ Shade in the area swept out by each planet's orbit. This helps visualize the orbits sweeping out equal areas in equal amounts of time. 

  ### How it works
  Stars and planets in space move according to 4 equations:
  1. Newton's equation of gravity:
  F = G &middot; m<sub>1</sub> &middot; m<sub>2</sub> / r<sub>1,2</sub><sup>2</sup>
  1. Newton's second law:
  F<sub>net</sub> = m &middot; a
  1. Definition of acceleration:
  a = <sup>dv</sup>&frasl;<sub>dt</sub>
  1. Definition of velocity:
  v = <sup>dx</sup>&frasl;<sub>dt</sub>

  These equations must be solved together in order to simulate realistic motion of stars and planets (or to predict the future positions of real stars and planets.)

  OuterSpaced solves this system of differential equations by implementing an algorithm called Euler's Method. This algorithm solves the equations by breaking the independent variable (time) into a finite number of discreet slices ("frames") during which we assume the derivative terms in the differential equations (acceleration, velocity) are fixed at their values at the beginning of the frame:

  - Euler's method: 
  &#x1D453;(x<sub>n+1</sub>) = &#x1D453;(x<sub>n</sub>) + <sup>d&#x1D453;(x)</sup>&frasl;<sub>dx</sub> | <sub>x = x<sub>n</sub></sub> &middot; (x<sub>n+1</sub> - x<sub>n</sub>)

  This assumption that the derivatives are constant for the duration of the frame is not true to reality: in real life, acceleration and velocity don't just stay flat for several milliseconds and then jump instantly to their next value. This discrepancy between physical reality and the assumptions of the algorithm means that the results of the simulation aren't exactly the same as what we'd observe in real life. 
  
  Approximations can still give results that are close enough for their use case, however. With time broken up into sufficiently small frames, the error becomes minute enough that the results are indistinguishable from scientific measurements. Reducing the duration of each frame comes at a cost, though: computing time. With the complexity of the system held constant, each frame, no matter its duration, takes the same fixed amount of computing time to calculate. This means that if you're going for accuracy and divide time into 1 millisecond slices, your simulation will take 1000 times longer to run than if you had chosen 1 second slices.

  In OuterSpaced, you can observe the effects of increasing or decreasing the simulation frame duration by adjusting the __Time__ parameter on the right hand side of the user interface. A greater value for the Time parameter increases the time slice width for Euler's method, making the simulation appear to run faster. Your computer doesn't get any faster when you increase this; it's just being less precise with its calculations by taking bigger steps forward. If you increase the Time parameter too much, you'll notice that the orbits go from looking like ellipses to looking like polygons. The straight edges of the polygonal orbits are caused by the assumption that velocity (direction and magnitude of motion) is fixed over the duration of the frame. You can also notice inaccuracies caused by OuterSpaced's use of Euler's Method during a time when the rate of change of gravitational force becomes very high (Euler's method assumes the rate of change of forces is zero within a frame), such as during a gravitational slingshot. When two planets are getting close leading up to the slingshot event, consider reducing the Time parameter so the event is more accurately handled.