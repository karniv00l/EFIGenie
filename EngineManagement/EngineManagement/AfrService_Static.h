#include "IAfrService.h"

#if !defined(AFRSERVICE_STATIC_H) && defined(IAFRSERVICE_H)
#define AFRSERVICE_STATIC_H
namespace ApplicationService
{
	class AfrService_Static : public IAfrService
	{
	public:
		AfrService_Static(float afr) { Afr = afr; Lambda = 1; }
		void CalculateAfr() { }
	};
}
#endif