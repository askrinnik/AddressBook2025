﻿using AddressBook.Api.Domain;
using AddressBook.Api.Interfaces;
using AddressBook.Contracts;
using Microsoft.EntityFrameworkCore;

namespace AddressBook.Api.DataAccess;

/// <summary>
/// Extension methods for configuring DataAccess layer
/// </summary>
public static class StartupExtensions
{
  /// <summary>
  /// Configure Entity Framework Core with SQL Server
  /// </summary>
  public static WebApplicationBuilder ConfigureDataAccess(this WebApplicationBuilder builder)
  {
    builder.Services.AddScoped<IRetrieveMany<GetFilteredContactsQuery, Contact>, AddressBookRepository>();
    builder.Services.AddScoped<IRetrieve<ContactId, Contact>, AddressBookRepository>();
    builder.Services.AddScoped<ICreate<Contact>, AddressBookRepository>();
    builder.Services.AddScoped<IDelete<ContactId>, AddressBookRepository>();
    builder.Services.AddScoped<IExist<ContactId>, AddressBookRepository>();

    ConfigureDbContext(builder);

    return builder;
  }

  /// <summary>
  /// Ensure database is created and migrations are applied
  /// </summary>
  public static WebApplication ExecuteDatabaseMigration(this WebApplication app)
  {
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.Migrate();

    return app;
  }

  /// <summary>
  /// Configure Entity Framework Core with SQL Server
  /// </summary>
  private static void ConfigureDbContext(WebApplicationBuilder builder)
  {
    var server = builder.Configuration["Database:Server"];
    var user = builder.Configuration["Database:User"];
    var password = builder.Configuration["Database:Password"];

    var connectionString =
      $"Server={server};Database=AddressBook;User={user};Password={password};TrustServerCertificate=True;MultipleActiveResultSets=true;Max Pool Size=2500";
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
      options.UseSqlServer(connectionString));
  }
}