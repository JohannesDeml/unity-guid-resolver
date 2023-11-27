# Unity GUID Resolver

![Logo](./docs/preview.png)

*Resolve GUIDs to their asset names on the web - useful for PR reviews* 

## Features

* Generate Json in Unity with a mapping of all guids to meta data such as the file name ([how-to](./unity/README.md))
* Import the mapping to the browser extension
* HTML dom will be traversed to find all GUIDs and are enriched with the meta data from the json
* Very helpful for code reviews and projects which heavily rely on ScriptableObjects

## Supported Browsers & Pages

- [x] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] github
- [x] gitlab
- [x] bitbucket server

## License

* MIT (c) Johannes Deml - see [LICENSE](./LICENSE.md)
