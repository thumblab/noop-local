# Noop Local

Interactive command line interface for local development of Noop applications.

### Table of Contents

- [Prerequisites](#prerequisites)
- [Package Install](#package-install)
- [CLI Commands](#cli-commands)
  - [Run](#run)
  - [Inspect](#inspect)
  - [Reset](#reset)
  - [Route](#route)

## Prerequisites

- [Node.js](https://nodejs.org/en/) - v10 or later, active LTS release recommended
- [Git](https://git-scm.com/)
- [Docker](docker.com)
- A Unix Shell (sh, bash, zsh, etc.) such as those utilized by macOS, Linux, Windows WSL or other Unix-based platforms

## Package Install

**`npm install -g noop-local`**

## CLI Commands

### Run

**`noop run [--root-path path/to/root] [--port 1234] [--disable-reload] [--env ENV_KEY=value componentName.ENV_KEY=value] [--env-file .envFile] [--component componentName] [--resource resourceName]`**

Run a Noop application on a local development server with auto-reloading when file changes are detected. If a `.noopEnv` file exists at the root-level of an application, it will automatically be read.

**`-R | --root-path`**

- Specify root path of an application
- Can be an absolute path or relative path to your current working directory
- If the `--root-path` flag is present, but a specified path is omitted, the root path will be assigned to current working directory
- **Default:** Git root of current directory

**`-p | --port`**

- Reassign the port binding for the local development server
- **Default:** 1234

**`-d | --disable-reload`**

- Disable auto-reload of on file changes
- **Default:** false

**`-e | --env`**

- Declares runtime environment variable(s)
- Syntax for global environment variable, `ENV_KEY=value`
- Syntax for component specific variables, `componentName.ENV_KEY=value`
- Declaring multiple environment variables can be listed with a single `--env` flag, `-e ENV_KEY1=value1 ENV_KEY2=value2`

**`-f | --env-file`**

- Specify paths to environment variable file(s)
- Can be absolute path or relative path to application's root path
- Individual lines in an environment variable file should match the syntax used by the `--env` flag to declare an environment variable
- Specifying multiple environment variable files can be listed with a single `--env-file` flag, `-f .envFile1 path/to/.envFile2`

**`-c | --component`**

- Name of component(s) to run in local development server
- Can be a list of component names with a single `--component` flag, `-c component1 component2`
- If the `--component` flag is present, but component names are omitted, the local development server will run no components
- **Default:** Runs all components defined in an application's Noopfiles

**`-r, --resource`**

- Name of resource(s) to run in local development server
- Can be a list of resource names with a single `--resource` flag, `-r resource1 resource2`
- If the `--resource` flag is present, but resource names are omitted, the local development server will run no resources
- **Default:** Runs all resources defined in an application's Noopfiles

### Inspect

**`noop inspect [noopfiles] [components] [resources] [routes] [--root-path path/to/root]`**

Analyzes a Noop application from its root path, and returns a JSON object with summary of the application in the terminal window. To inspect a specified aspects of an application, include one or more of the following "types" with the `noop inspect` command: `noopfiles`, `components`, `resources`, `routes`. If a "type" is omitted, all details will be provided.

**`-R | --root-path`**

- Same functionality as `--root-path` flag's usage with `run` command

### Reset

**`noop reset [resourceName1] [resourceName2] [--root-path path/to/root]`**

The state of an application's resources persist between executions of the `run` command. To clear the state of a specified resource include its name after entering `noop reset` into your terminal window. You can reset multiple resources at once by listing their names.

**`-R | --root-path`**

- Same functionality as `--root-path` flag's usage with `run` command

### Route

**`noop route [path] [method] [--root-path path/to/root]`**

Evaluate what component a specific request will be routed to based on `ROUTE` directives in an application's Noopfiles. `path` option should match the pattern expected to be included in the HTTP header of a request to the application. Valid options for `method` include `GET`, `PUT`, `POST`, `DELETE`, and `OPTIONS`. If method is omitted, `GET` will be used by default.

**`-R | --root-path`**

- Same functionality as `--root-path` flag's usage with `run` command
