using Microsoft.EntityFrameworkCore;
using AddressBook.Web.Domain;

namespace AddressBook.Web.DataAccess;

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
      new PhoneOperator { Id = 1, Name = "Vodafone UA", Description = "Mobile operator Vodafone in Ukraine" },
      new PhoneOperator { Id = 2, Name = "Kyivstar UA", Description = "Mobile operator Kyivstar in Ukraine" },
      new PhoneOperator { Id = 3, Name = "Super EE", Description = "Mobile operator Super in Estonia" }
    );

    modelBuilder.Entity<Contact>().HasData(
      new Contact { Id = 1, OwnerId = 1, FirstName = "John", LastName = "Doe", Birthday = new DateTime(1990, 1, 1) },
      new Contact { Id = 2, OwnerId = 1, FirstName = "Jane", LastName = "Smith", Birthday = new DateTime(1992, 2, 2) }
    );

    modelBuilder.Entity<Phone>().HasData(
      new Phone { Id = 1, ContactId = 1, PhoneOperatorId = 1, PhoneNumber = "1234567890", Comment = "John's Phone 1" },
      new Phone { Id = 2, ContactId = 1, PhoneOperatorId = 2, PhoneNumber = "0987654321", Comment = "John's Phone 2" },
      new Phone { Id = 3, ContactId = 2, PhoneOperatorId = 1, PhoneNumber = "1112223333", Comment = "Jane's Phone 1" },
      new Phone { Id = 4, ContactId = 2, PhoneOperatorId = 2, PhoneNumber = "4445556666", Comment = "Jane's Phone 2" }
    );
  }
}