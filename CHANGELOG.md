## [1.4.0](https://github.com/marcoklein/impftermin/compare/1.3.0...1.4.0) (2021-05-08)

### Features

- check if the code has already been used ([#20](https://github.com/marcoklein/impftermin/issues/20)) ([1e12ba7](https://github.com/marcoklein/impftermin/commit/1e12ba74119a4cbec88cfdfe667669cfe57727ee))

### Bug Fixes

- increase appointment waiting time ([127db41](https://github.com/marcoklein/impftermin/commit/127db41568ef1074f4f6a786616ca133912a6d09)), closes [#18](https://github.com/marcoklein/impftermin/issues/18)
- sound if no internet connection ([#19](https://github.com/marcoklein/impftermin/issues/19)) ([e855953](https://github.com/marcoklein/impftermin/commit/e85595358fde4a95086fd2276eab8bf0bad6b70c)), closes [#7](https://github.com/marcoklein/impftermin/issues/7)

## [1.3.0](https://github.com/marcoklein/impftermin/compare/1.2.0...1.3.0) (2021-05-07)

### Features

- interactive CLI to create a config.json ([#10](https://github.com/marcoklein/impftermin/issues/10)) ([6728f95](https://github.com/marcoklein/impftermin/commit/6728f95bb289cb2d6f598696d15a1dc8f05eb5d6))

### Bug Fixes

- add leading zero when minute is lower than 10 ([#11](https://github.com/marcoklein/impftermin/issues/11)) ([06df29b](https://github.com/marcoklein/impftermin/commit/06df29b31f69c43e05ea87212761cf6742d036b1))
- Remove unnecessary build step before packaging ([#12](https://github.com/marcoklein/impftermin/issues/12)) ([aabc62a](https://github.com/marcoklein/impftermin/commit/aabc62a3084d3ba88a192e222a8a40bf9eae6c72))

### Chores

- change github action commit message ([d217e82](https://github.com/marcoklein/impftermin/commit/d217e82e1a09883aea94c1235c2bd1e2ebddae4b))
- change prettier action to not run on prs ([4c3a12e](https://github.com/marcoklein/impftermin/commit/4c3a12e48f7dd732b1e96f4565b6f196e59c07c6))
- formatting source code ([df472c0](https://github.com/marcoklein/impftermin/commit/df472c050c687a2a13e65213f64227a4aa0ee3f1))

## [1.2.0](https://github.com/marcoklein/impftermin/compare/1.1.0...1.2.0) (2021-05-06)

### Features

- Add support for Linux and macOS (x64) ([#4](https://github.com/marcoklein/impftermin/issues/4)) ([1b0cd87](https://github.com/marcoklein/impftermin/commit/1b0cd877dacccd525d25fd996e9a4dc5b5d63b80))

### Bug Fixes

- --silent flag to env-cmd to run without .env ([2a7324c](https://github.com/marcoklein/impftermin/commit/2a7324c61ab02b92150b138c6f93f7bba6b23d45)), closes [#8](https://github.com/marcoklein/impftermin/issues/8)
- release-it hook is now called ([#9](https://github.com/marcoklein/impftermin/issues/9)) ([98dd40e](https://github.com/marcoklein/impftermin/commit/98dd40e028123c3ec21b96ab3f46ae4b84fe3411))

### Chores

- formatting source code ([bafca65](https://github.com/marcoklein/impftermin/commit/bafca652f5977441785d2f82a319606c6abc5d3c))
- GitHub action for automated code formatting ([6a968f2](https://github.com/marcoklein/impftermin/commit/6a968f258e3f63996fe91cc6598dbdd548f462cf))

## [1.1.0](https://github.com/marcoklein/impftermin/compare/1.0.2...1.1.0) (2021-05-06)

### Features

- show next check time after unsuccessful check ([#5](https://github.com/marcoklein/impftermin/issues/5)) ([ec18eef](https://github.com/marcoklein/impftermin/commit/ec18eef1e08f4aa84324189b8469ceb10c9d1019))

### Chores

- readme typo ([8d9d574](https://github.com/marcoklein/impftermin/commit/8d9d57407642b32884083ab7fcbfe31bede1b371))

### [1.0.2](https://github.com/marcoklein/impftermin/compare/1.0.1...1.0.2) (2021-05-04)

### Bug Fixes

- add typescript as dev dependency ([ab9eab6](https://github.com/marcoklein/impftermin/commit/ab9eab65da5c8f2a66ff49756e221336559bdef1))
- fix link to impfterminservice.de ([428ce2d](https://github.com/marcoklein/impftermin/commit/428ce2d0f87ffc642a630c90f33a4aecfc7e7a19))
- typo in debug statement ([196fe6a](https://github.com/marcoklein/impftermin/commit/196fe6ae6b4854682141803c4b98537c9ad8d66f))

### Chores

- added cover gif for readme ([f20048d](https://github.com/marcoklein/impftermin/commit/f20048d0b3dfec3aac576612974e02ab14829d3a))

### [1.0.1](https://github.com/marcoklein/impftermin/compare/1.0.0...1.0.1) (2021-05-04)

### Bug Fixes

- using relative paths to load configuration ([664134e](https://github.com/marcoklein/impftermin/commit/664134ed43bc065928e003bedfad9f4151ec9e80))

### Chores

- add changelog ([1cd28eb](https://github.com/marcoklein/impftermin/commit/1cd28eba53412b43234b6370e177dc2b853915a9))
- adjust heading ([628c97f](https://github.com/marcoklein/impftermin/commit/628c97fec3e2d69c58899fa611b1c94fd94c8bd5))
- configure changelog generation ([b2c19be](https://github.com/marcoklein/impftermin/commit/b2c19be1280b4403209cc3940896ce5b0534b36f))
- delete package lock ([3414c78](https://github.com/marcoklein/impftermin/commit/3414c78eeee36c218f5457617bd909c567154c61))
- specify docs ([123a61c](https://github.com/marcoklein/impftermin/commit/123a61c6bd97a3aee533654752af8a073ffae99e))

# 1.0.0 (2021-05-03)

Initial public release version of Impftermin.
