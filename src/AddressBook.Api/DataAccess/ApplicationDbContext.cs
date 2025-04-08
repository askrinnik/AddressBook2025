using System.Linq.Expressions;
using AddressBook.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query.SqlExpressions;

namespace AddressBook.Api.DataAccess;

internal class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
  public DbSet<Contact> Contacts { get; set; }
  public DbSet<Phone> Phones { get; set; }
  public DbSet<PhoneOperator> PhoneOperators { get; set; }

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    modelBuilder.ApplyConfiguration(new PhoneOperatorConfiguration());
    modelBuilder.ApplyConfiguration(new ContactConfiguration());
    modelBuilder.ApplyConfiguration(new PhoneConfiguration());

    // Seed data
    modelBuilder.Entity<PhoneOperator>().HasData(
      new PhoneOperator { Id = new(1), Name = "Vodafone UA", Description = "Mobile operator Vodafone in Ukraine" },
      new PhoneOperator { Id = new(2), Name = "Kyivstar UA", Description = "Mobile operator Kyivstar in Ukraine" },
      new PhoneOperator { Id = new(3), Name = "Super EE", Description = "Mobile operator Super in Estonia" }
    );

    modelBuilder.Entity<Contact>().HasData(
      new Contact { Id = new(1), OwnerId = OwnerId.Default(), FirstName = "John", LastName = "Doe", Birthday = new DateTime(1990, 1, 1) },
      new Contact { Id = new(2), OwnerId = OwnerId.Default(), FirstName = "Jane", LastName = "Smith", Birthday = new DateTime(1992, 2, 2) }
    );

    modelBuilder.Entity<Phone>().HasData(
      new Phone { Id = new(1), ContactId = new(1), PhoneOperatorId = new(1), PhoneNumber = "1234567890", Comment = "John's Phone 1" },
      new Phone { Id = new(2), ContactId = new(1), PhoneOperatorId = new(2), PhoneNumber = "0987654321", Comment = "John's Phone 2" },
      new Phone { Id = new(3), ContactId = new(2), PhoneOperatorId = new(1), PhoneNumber = "1112223333", Comment = "Jane's Phone 1" },
      new Phone { Id = new(4), ContactId = new(2), PhoneOperatorId = new(2), PhoneNumber = "4445556666", Comment = "Jane's Phone 2" }
    );

    modelBuilder
      .DefineWrapper(() => ((OwnerId?)null).Unwrap())
      .DefineWrapper(() => ((ContactId?)null).Unwrap())
      .DefineWrapper(() => ((PhoneOperatorId?)null).Unwrap())
      .DefineWrapper(() => ((PhoneId?)null).Unwrap());
  }
}

internal static class ValueObjectExtensions
{
  public static ModelBuilder DefineWrapper(this ModelBuilder modelBuilder, Expression<Func<int>> expression)
  {
    modelBuilder
      .HasDbFunction(expression)
      .HasTranslation(args => new SqlFunctionExpression("", args, false, [false], typeof(int), null))
      .HasParameter("id")
      .HasStoreType("int");
    return modelBuilder;
  }
  public static int Unwrap(this OwnerId? id) => throw new NotImplementedException();
  public static int Unwrap(this ContactId? id) => throw new NotImplementedException();
  public static int Unwrap(this PhoneId? id) => throw new NotImplementedException();
  public static int Unwrap(this PhoneOperatorId? id) => throw new NotImplementedException();
}