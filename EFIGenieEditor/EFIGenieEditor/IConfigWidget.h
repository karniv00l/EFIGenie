#include <string>
#include <QWidget>

#ifndef IConfigWidget_H
#define IConfigWidget_H
class IConfigWidget
{
public:
	virtual void * getValue() = 0;
	virtual void setValue(void *) = 0;
	virtual unsigned int size() = 0;
	virtual bool isPointer() = 0;
	virtual std::string getType() = 0;
};
#endif