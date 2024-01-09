# Unity GUID Resolver

![Logo](./docs/preview.png)

[![](https://img.shields.io/github/release-date/JohannesDeml/unity-guid-resolver.svg)](https://github.com/JohannesDeml/unity-guid-resolver/releases) [![openupm](https://img.shields.io/npm/v/com.jd.guidresolver?label=openupm&registry_uri=https://package.openupm.com)](https://openupm.com/packages/com.jd.guidresolver/)

*Resolve GUIDs to their asset names on the web* 

This repo is experimental and was created out of the need to have a better experience doing PR reviews of unity assets. Since GUIDs are not easily readable, adding information on the asset name it is actually liking to gives a lot more context on changes.

## Features

* Generate Json in Unity with a mapping of all guids to meta data such as the file name ([how-to](./unity/README.md))
* Import the mapping to the browser extension
* HTML dom will be traversed to find all GUIDs and are enriched with the meta data from the json
* Very helpful for code reviews and projects which heavily rely on ScriptableObjects

### Supported Browsers

- [x] Chrome
- [ ] Firefox
- [ ] Safari

### Supported Pages

- [ ] github
- [x] gitlab
- [x] bitbucket server

## Setup

[![Setup and Demo video](https://i.imgur.com/uECrI0G.png)](https://www.youtube.com/watch?v=Cek_NIIUSBI)

1. Add the Unity package to your project, there are several possibilities how to do so:
   1. Install through OpenUpm: `openupm add com.jd.guidresolver`
   2. Add in the package manager: `https://github.com/JohannesDeml/unity-guid-resolver.git#1.0.0`
   3. Download the package from the [releases](https://github.com/JohannesDeml/unity-guid-resolver/releases/) and import it through `Assets > Import Package` 
2. Export the guids lookup file by running the menu item `Assets > Generate GUID Mapping`. The file will be exported to `UnityProjectFolderRoot/Builds/guid-mapping.json`
3. Download the chrome extension folder from the [releases](https://github.com/JohannesDeml/unity-guid-resolver/releases/) and unpack the zip or clone the project
4. In Chrome, go to the extensions and enable the developer mode
5. Select Load unpacked and point to the chrome folder you downloaded
6. Select the extension in your browser menu bar and click on select to choose a mapping file you want to use - Select the one that you generated in step 2.
7. Reload your current page - If you can't see any mapping applied you can use the `Update Labels` button in the extension popup.

## License

* MIT (c) Johannes Deml - see [LICENSE](./LICENSE.md)
