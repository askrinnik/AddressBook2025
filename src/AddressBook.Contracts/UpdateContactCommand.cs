using MediatR;
using AddressBook.Contracts.Models;

namespace AddressBook.Contracts;

public class UpdateContactCommand : IRequest<UpdateContactCommandResponse>
{
  /// <summary>
  /// Contact ID (set from route)
  /// </summary>
  public int Id { get; set; }

  /// <summary>
  /// First name
  /// </summary>
  public string FirstName { get; set; } = string.Empty;

  /// <summary>
  /// Last name
  /// </summary>
  public string LastName { get; set; } = string.Empty;

  /// <summary>
  /// Birthday
  /// </summary>
  public DateOnly? Birthday { get; set; }
}
