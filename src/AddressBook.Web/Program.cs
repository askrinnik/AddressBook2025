using AddressBook.Web;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(_ =>
  new HttpClient
  {
    BaseAddress = new(builder.Configuration["API_Prefix"] ?? "http://localhost:5000/api/")
  });
builder.Services.AddScoped<IAddressBookApiService, AddressBookApiService>();

await builder.Build().RunAsync();
