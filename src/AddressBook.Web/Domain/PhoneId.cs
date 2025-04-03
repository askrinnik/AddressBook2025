namespace AddressBook.Web.Domain;

/// <summary>
/// Phone identifier
/// </summary>
/// <param name="Value"></param>
public record PhoneId(int Value)
{
  /// <summary>
  /// New Phone identifier
  /// </summary>
  /// <returns></returns>
  public static PhoneId New() => new(0);
}