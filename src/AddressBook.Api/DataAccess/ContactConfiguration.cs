using AddressBook.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AddressBook.Api.DataAccess;

internal class ContactConfiguration : IEntityTypeConfiguration<Contact>
{
  public void Configure(EntityTypeBuilder<Contact> builder)
  {
    builder.HasKey(e => e.Id);
    builder.Property(e => e.Id)
      .UseIdentityColumn()
      .HasConversion(
        contactId => contactId.Value,
        value => new(value));

    builder.Property(e => e.OwnerId)
      .IsRequired()
      .HasConversion(
        ownerId => ownerId.Value,
        value => new(value));

    builder.Property(e => e.FirstName)
      .HasMaxLength(30)
      .IsRequired();

    builder.Property(e => e.LastName)
      .HasMaxLength(30)
      .IsRequired();

    builder.Property(e => e.Birthday)
      .IsRequired(false);

    builder.HasMany(e => e.Phones);
  }
}