using AddressBook.Web;
using AddressBook.Web.ErrorHandling;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using MudBlazor.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddTransient<ProblemDetailsHandler>();
builder.Services.AddScoped<IAddressBookApiService, AddressBookApiService>();

builder.Services.AddHttpClient<IAddressBookApiService, AddressBookApiService>(
        client => client.BaseAddress = new(builder.Configuration["API_Prefix"] ?? "http://localhost:5000/api/"))
    .AddHttpMessageHandler<ProblemDetailsHandler>();

builder.Services.AddMudServices();

await builder.Build().RunAsync();