using AddressBook.Web.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AddressBook.Web.DataAccess;

internal class PhoneConfiguration : IEntityTypeConfiguration<Phone>
{
  public void Configure(EntityTypeBuilder<Phone> builder)
  {
    builder.HasKey(e => e.Id);

    builder.Property(e => e.Id)
      .UseIdentityColumn()
      .HasConversion(
        phoneId => phoneId.Value,
        value => new(value));

    builder.Property(e => e.ContactId)
      .HasConversion(
        contactId => contactId.Value,
        value => new(value));

    builder.Property(e => e.PhoneOperatorId)
      .HasConversion(
        operatorId => operatorId.Value,
        value => new(value));

    builder.Property(e => e.PhoneNumber)
        .HasMaxLength(15)
        .IsRequired();
    builder.Property(e => e.Comment)
        .HasMaxLength(100)
        .IsRequired(false);

    builder.HasOne(e => e.Contact)
        .WithMany(e => e.Phones)
        .HasForeignKey(e => e.ContactId);

    builder.HasOne(e => e.PhoneOperator)
        .WithMany(e => e.Phones)
        .HasForeignKey(e => e.PhoneOperatorId);
  }
}
