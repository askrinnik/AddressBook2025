# Hosting in Azure

The application. are hosted in the Microsoft Azure. It consist on the following parts:

## SQL Server and database
Server Name: `sanyascr.database.windows.net`  
Username and password need to be requested on Alex.

## REST API
The API is hosted on the following address:  
https://addressbook-api-h5gmdghdcyfaf6gu.westeurope-01.azurewebsites.net/swagger/index.html

It should be started first to warm  up the service.

## Web UI
The API is hosted on the following address:  
https://happy-river-0d4a91803-preview.westeurope.6.azurestaticapps.net/

It should be started after the API was warmed up.

### Client-Side Routing Configuration
The Web UI is a Blazor WebAssembly application with client-side routing. To support direct navigation to routes like `/contacts` or `/create-contact` (including page refresh), the application includes a `staticwebapp.config.json` file in the `wwwroot` folder.

This configuration file instructs Azure Static Web Apps to return `index.html` for all navigation requests that aren't static assets (like JS, CSS, images, or framework files). This allows the Blazor router to handle all routing on the client side.

