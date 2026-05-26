## How to run the application in a console window
It is necessary to create a BAT-file with the following content:

```
pushd <path to AddressBook.Web project>
git pull
dotnet build
dotnet run --Database:Password=<PASSWORD>
pause
```
