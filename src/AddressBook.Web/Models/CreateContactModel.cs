using System.ComponentModel.DataAnnotations;

namespace AddressBook.Web.Models;

/// <summary>
/// Model for creating a new contact
/// </summary>
public class CreateContactModel
{
    /// <summary>
    /// First name
    /// </summary>
    [Required]
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// Last name
    /// </summary>
    [Required]
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// Birthday
    /// </summary>
    public DateOnly? Birthday { get; set; }
}