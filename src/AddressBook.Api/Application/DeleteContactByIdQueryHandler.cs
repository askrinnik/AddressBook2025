using AddressBook.Api.Domain;
using AddressBook.Api.Interfaces;
using AddressBook.Contracts;
using AddressBook.Contracts.Models;
using MediatR;

namespace AddressBook.Api.Application;

internal class DeleteContactByIdQueryHandler(
    IDelete<ContactId> deleter) : IRequestHandler<DeleteContactByIdQuery, DeleteContactByIdResponse>
{
  public async Task<DeleteContactByIdResponse> Handle(DeleteContactByIdQuery request, CancellationToken cancellationToken)
  {
      var deletedRows = await deleter.DeleteAsync(new(request.Id));
      return new(deletedRows > 0);
    }
}