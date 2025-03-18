using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.MapScalarApiReference(o => o.OpenApiRoutePattern = "/swagger/{documentName}/swagger.json");

//app.UseHttpsRedirection();
//app.UseAuthorization();

app.MapControllers();

app.Run();
