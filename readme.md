# Image Proxy for use with Foundry VTT / VTTA.io modules

Sample implementation of a very simple image proxy to circument CORS restrictions

## Installation

1. yarn install
2. Rename .env.example to .env and set your desired webserver port in there
3. yarn run serve
4. Within Foundry, set the game setting for vtta-core to use your own proxy The basic command to do that is
   `game.settings.set('vtta-core', 'proxy', 'http://localhost:4001/%URL%?access_token=MY_SECRET_ACCESS_TOKEN');` The URL scheme used in this command is very dependant on the adjustments you are making to the source code, please see the comment within the source, especially on the `authorize` function.

## Details

The source code is commented pretty thoroughly. If you are still having trouble, then this solution might not be the right one for you (sorry!).

## Support

Besides providing this exemplary server, no support will be available. The target audience for this repository are technical verse people that want to run their own proxy. If you don't feel adventurous: The 2$ tier of my Patreon already provides access to the vtta.io proxy without any further hassle - or you can adjust your workflows to not _need_ a proxy in the first place.
