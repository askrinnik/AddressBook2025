using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

app.MapOpenApi();
app.UseSwaggerUI(o =>
  o.SwaggerEndpoint("/openapi/v1.json", "v1"));
app.MapScalarApiReference();

//app.UseHttpsRedirection();
//app.UseAuthorization();

app.MapControllers();

app.Run();
