namespace AddressBook.Api.Domain;

/// <summary>
/// Phone entity
/// </summary>
public sealed class Phone : Entity<PhoneId>
{
  /// <summary>
  /// Contact identifier
  /// </summary>
  public ContactId ContactId { get; set; } = ContactId.New();

  /// <summary>
  /// Contact entity
  /// </summary>
  public Contact Contact { get; set; } = null!;

  /// <summary>
  /// Phone operator identifier
  /// </summary>
  public PhoneOperatorId PhoneOperatorId { get; set; } = PhoneOperatorId.New();

  /// <summary>
  /// Phone number
  /// </summary>
  public string PhoneNumber { get; set; } = string.Empty;

  /// <summary>
  /// Comment
  /// </summary>
  public string Comment { get; set; } = string.Empty;

  /// <summary>
  /// Phone operator entity
  /// </summary>
  public PhoneOperator PhoneOperator { get; set; } = null!;
}
