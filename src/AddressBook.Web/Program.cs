using AddressBook.Web;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSwaggerGen();

builder.ConfigureDatabase();

var app = builder.Build();

app.ExecuteDatabaseMigration();

app.UseSwagger();
app.UseSwaggerUI();
app.MapScalarApiReference(o => o.OpenApiRoutePattern = "/swagger/{documentName}/swagger.json");

//app.UseHttpsRedirection();
//app.UseAuthorization();

app.MapControllers();

app.Run();
