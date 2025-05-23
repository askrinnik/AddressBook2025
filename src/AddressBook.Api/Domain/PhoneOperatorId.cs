namespace AddressBook.Api.Domain;

/// <summary>
/// Phone Operator identifier
/// </summary>
/// <param name="Value"></param>
public sealed record PhoneOperatorId(int Value)
{
  /// <summary>
  /// New Phone Operator identifier
  /// </summary>
  /// <returns></returns>
  public static PhoneOperatorId New() => new(0);
}