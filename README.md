Noop CLI
========
Interactive command line interface for Noop Platform and local development

## Local Install
```
git clone git@github.com:rearc/noop-cli.git
cd noop-cli
npm install
npm link
```

## Commands
#### Run the app in local development mode which auto reloads
`noop run`

#### Analyze current project directory and display summary information
`noop info` (not implemented)

#### Initialize a new project
`noop init` (not implemented)

Auto-detect what we can from the repo and then interact with user to provide additional detail.

#### Create new a component
`noop add component --type service --template nodejs --name ProductSite` (not implemented)

Parameters
- name? (do components have names?)
- type (service, function, persistent?, static)
- template

#### Create a new resource for the current component
`noop add resource --type mysql --name products` (not implemented)

Parameters
- name
- type (mysql, dynamodb, s3)
