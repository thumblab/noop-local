Noop CLI
========
Interactive command line interface for Noop Platform and local development

## Approach


## Example Commands
#### Analyze current project directory and display summary information
`noop info`

#### Initialize a new project
`noop init`

Auto-detect what we can from the repo and then interact with user to provide additional detail.

#### Create new a component
`noop add component --type service --template nodejs --name ProductSite`

Parameters
- name? (do components have names?)
- type (service, function, persistent?, static)
- template

#### Create a new resource for the current component
`noop add resource --type mysql --name products`

Parameters
- name
- type (mysql, dynamodb, s3)

#### Run the app in local development mode
`noop run`

#### Run in local development mode, auto refresh on code change
`noop watch`
